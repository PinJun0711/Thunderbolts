import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set');
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Mongoose schemas and models
const StockItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    unit: { type: String, required: true },
    quantityAvailable: { type: Number, required: true, default: 0 },
    costPerUnit: { type: Number, default: 0 },
    minimumThreshold: { type: Number, default: 10 },
    maximumThreshold: { type: Number, default: 100 }
  },
  { timestamps: true }
);

const StockItem = mongoose.model('StockItem', StockItemSchema);
const MenuItemSchema = new mongoose.Schema(
  {
    foodId: { type: String, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, default: 'food' },
    price: { type: Number, required: true },
    imageUrl: { type: String, default: '' },
    stockNeeds: [
      {
        name: String, // e.g., Chicken Breast
        unit: String, // e.g., kg, pcs, g
        quantity: Number
      }
    ]
  },
  { timestamps: true }
);

const MenuItem = mongoose.model('MenuItem', MenuItemSchema);
const OrderItemSchema = new mongoose.Schema(
  {
    foodId: { type: String, required: true },
    foodName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: false },
    lineTotal: { type: Number, required: false },
    spices: { type: String, default: '' },
    requirement: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'preparing', 'ready', 'completed'], default: 'pending' }
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    pax: { type: Number, required: true, min: 1 },
    table: { type: String, default: '' },
    items: { type: [OrderItemSchema], default: [] },
    totalAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'sent', 'completed'], default: 'pending' },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', OrderSchema);

// Routes
app.get('/', (req, res) => {
  res.send("Hello from Thunderbolts on EC2!");
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Menu endpoint
app.get('/api/menu', async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    console.error('Get menu error:', err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// Stock endpoint
app.get('/api/stock', async (req, res) => {
  try {
    const items = await StockItem.find().sort({ name: 1 });
    res.json(items);
  } catch (err) {
    console.error('Get stock error:', err);
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
});

// Create order
app.post('/api/orders', async (req, res) => {
  try {
    const { pax, table, items } = req.body;

    if (!pax || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'pax and items are required' });
    }

    // Validate table 1-10 if provided
    const tableStr = (table || '').toString().trim();
    if (!tableStr) {
      return res.status(400).json({ error: 'table is required' });
    }
    const tableNum = Number(tableStr);
    if (!Number.isInteger(tableNum) || tableNum < 1 || tableNum > 10) {
      return res.status(400).json({ error: 'table must be an integer 1-10' });
    }

    // Allow multiple active orders per table per new requirement

    const ids = [...new Set(items.map((i) => i.foodId))];
    const menuItems = await MenuItem.find({ foodId: { $in: ids } });
    const idToMenu = new Map(menuItems.map((m) => [m.foodId, m]));

    const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
    const enriched = items.map((i) => {
      const menu = idToMenu.get(i.foodId);
      const unitPrice = round2(menu ? menu.price : 0);
      const lineTotal = round2(unitPrice * i.quantity);
      return { 
        ...i, 
        unitPrice, 
        lineTotal, 
        foodName: i.foodName || menu?.name || 'Unknown',
        status: 'sent' // Match the order status when order is sent
      };
    });
    const totalAmount = enriched.reduce((sum, it) => sum + (it.lineTotal || 0), 0);
    const totalAmountRounded = round2(totalAmount);

    const order = await Order.create({ pax, table: tableStr, items: enriched, totalAmount: totalAmountRounded, status: 'sent' });
    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});
// Active tables summary (counts of not-completed orders per table)
app.get('/api/active-tables', async (req, res) => {
  try {
    const pipeline = [
      { $match: { status: { $ne: 'completed' } } },
      { $group: { _id: '$table', activeOrders: { $sum: 1 }, pax: { $sum: '$pax' } } },
      { $project: { table: '$_id', activeOrders: 1, pax: 1, _id: 0 } },
      { $sort: { table: 1 } }
    ];
    const results = await Order.aggregate(pipeline);
    res.json(results);
  } catch (err) {
    console.error('Active tables error:', err);
    res.status(500).json({ error: 'Failed to fetch active tables' });
  }
});

// List orders (recent first)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
    res.json(orders);
  } catch (err) {
    console.error('List orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Mark order completed
app.post('/api/orders/:id/complete', async (req, res) => {
  try {
    const id = req.params.id;
    const order = await Order.findByIdAndUpdate(
      id,
      { status: 'completed', completedAt: new Date() },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('Complete order error:', err);
    res.status(500).json({ error: 'Failed to complete order' });
  }
});

// Restock endpoint
app.post('/api/stock/restock', async (req, res) => {
  try {
    const { itemId, quantity, cost } = req.body;
    
    if (!itemId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid item ID or quantity' });
    }

    const item = await StockItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Update quantity
    item.quantityAvailable += quantity;
    
    // Update cost if provided
    if (cost > 0) {
      item.costPerUnit = cost;
    }
    
    await item.save();
    
    res.json({
      success: true,
      item: {
        _id: item._id,
        name: item.name,
        unit: item.unit,
        quantityAvailable: item.quantityAvailable,
        costPerUnit: item.costPerUnit
      }
    });
  } catch (err) {
    console.error('Restock error:', err);
    res.status(500).json({ error: 'Failed to restock item' });
  }
});

// Forecast endpoint (for SageMaker integration)
app.post('/api/forecast', async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    // For now, return mock forecast data
    // In production, this would call your SageMaker LSTM endpoint
    const mockForecast = {
      predictions: items.map(item => {
        const currentStock = item.currentStock || 0;
        const predicted7days = Math.max(0, currentStock - (Math.random() * 10));
        const predicted30days = Math.max(0, currentStock - (Math.random() * 50));
        
        let recommendation = 'Good';
        if (predicted7days <= 0) {
          recommendation = 'Restock';
        } else if (predicted30days <= 10) {
          recommendation = 'Monitor';
        }
        
        return {
          name: item.name,
          currentStock: currentStock,
          predicted7days: predicted7days,
          predicted30days: predicted30days,
          recommendation: recommendation,
          unit: item.unit
        };
      })
    };

    res.json(mockForecast);
  } catch (err) {
    console.error('Forecast error:', err);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

// Cooking sequence optimization endpoint
app.get('/api/cooking-sequence', async (req, res) => {
  try {
    // Get all active orders (not completed)
    const activeOrders = await Order.find({ status: { $ne: 'completed' } })
      .sort({ createdAt: 1 }) // Oldest orders first
      .lean();

    // Extract all pending items from active orders
    const pendingItems = [];
    activeOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.status === 'pending' || item.status === 'sent') {
          // Add cooking time estimates based on food type
          let cookingTime = 15;
          let preparationTime = 5;
          let priority = 'medium';
          
          const name = item.foodName.toLowerCase();
          if (name.includes('roti') || name.includes('canai')) {
            cookingTime = 8;
            preparationTime = 3;
            priority = 'high';
          } else if (name.includes('nasi') || name.includes('lemak')) {
            cookingTime = 12;
            preparationTime = 5;
            priority = 'high';
          } else if (name.includes('goreng')) {
            cookingTime = 10;
            preparationTime = 4;
            priority = 'medium';
          } else if (name.includes('drink') || name.includes('teh') || name.includes('milo')) {
            cookingTime = 3;
            preparationTime = 2;
            priority = 'low';
          }
          
          pendingItems.push({
            ...item,
            orderId: order._id,
            table: order.table,
            pax: order.pax,
            orderCreatedAt: order.createdAt,
            cookingTime,
            preparationTime,
            priority,
            totalTime: preparationTime + cookingTime
          });
        }
      });
    });

    // Optimize cooking sequence using multiple algorithms
    const optimizedSequence = optimizeCookingSequence(pendingItems);

    // Group by cooking stations (simulate different cooking areas)
    const cookingStations = groupByCookingStations(optimizedSequence);

    // Calculate estimated completion times
    const estimatedTimes = calculateCompletionTimes(cookingStations);

    res.json({
      cookingSequence: optimizedSequence,
      cookingStations,
      estimatedTimes,
      totalItems: pendingItems.length,
      totalOrders: activeOrders.length,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Cooking sequence error:', err);
    res.status(500).json({ error: 'Failed to generate cooking sequence' });
  }
});

// Update order item status
app.post('/api/cooking-sequence', async (req, res) => {
  try {
    const { orderId, itemId, status } = req.body;

    if (!orderId || !itemId || !status) {
      return res.status(400).json({ error: 'orderId, itemId, and status are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update the specific item status
    const item = order.items.find(item => item.foodId === itemId);
    if (item) {
      item.status = status;
      
      // If all items are completed, mark the order as completed
      const allCompleted = order.items.every(item => item.status === 'completed');
      if (allCompleted) {
        order.status = 'completed';
        order.completedAt = new Date();
      }
      
      await order.save();
    }

    res.json({ 
      success: true, 
      message: `Item status updated to ${status}`,
      order: order
    });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Helper functions for cooking sequence optimization
function optimizeCookingSequence(items) {
  if (items.length === 0) return [];

  // Multiple optimization strategies
  const scored = items.map(item => {
    let score = 0;
    
    // Priority score (higher priority = higher score)
    const priorityScore = { high: 100, medium: 50, low: 0 };
    score += priorityScore[item.priority] * 0.4;
    
    // Time score (shorter time = higher score)
    score += (60 - item.totalTime) * 0.3;
    
    // Table order score (earlier table = higher score)
    const tableNum = parseInt(item.table) || 10;
    score += (11 - tableNum) * 10 * 0.3;
    
    // Order age score (older orders = higher score)
    const ageMinutes = (new Date() - new Date(item.orderCreatedAt)) / (1000 * 60);
    score += Math.min(ageMinutes * 2, 50);
    
    return { ...item, score };
  });

  return scored.sort((a, b) => b.score - a.score);
}

function groupByCookingStations(sequence) {
  // Simulate different cooking stations
  const stations = {
    'Hot Kitchen': [], // Main dishes, rice, noodles
    'Cold Prep': [],   // Salads, drinks
    'Grill Station': [], // Grilled items
    'Fry Station': []   // Fried items
  };

  sequence.forEach(item => {
    const category = (item.category || 'food').toLowerCase();
    const name = item.foodName.toLowerCase();
    
    if (name.includes('drink') || name.includes('teh') || name.includes('milo') || 
        name.includes('sirap') || category === 'drinks') {
      stations['Cold Prep'].push(item);
    } else if (name.includes('roti') || name.includes('canai') || 
               name.includes('telur') || name.includes('grill')) {
      stations['Grill Station'].push(item);
    } else if (name.includes('goreng') || name.includes('fried')) {
      stations['Fry Station'].push(item);
    } else {
      stations['Hot Kitchen'].push(item);
    }
  });

  return stations;
}

function calculateCompletionTimes(stations) {
  const times = {};
  let currentTime = new Date();

  Object.entries(stations).forEach(([stationName, items]) => {
    if (items.length === 0) {
      times[stationName] = { estimatedStart: null, estimatedComplete: null, totalTime: 0 };
      return;
    }

    let stationStartTime = new Date(currentTime);
    let cumulativeTime = 0;
    
    const itemTimeline = items.map((item, index) => {
      const startTime = new Date(stationStartTime.getTime() + cumulativeTime * 60000);
      const prepTime = item.preparationTime || 5;
      const cookingTime = item.cookingTime || 15;
      const totalItemTime = prepTime + cookingTime;
      
      const timeline = {
        ...item,
        stationStartTime: startTime,
        prepStartTime: startTime,
        cookingStartTime: new Date(startTime.getTime() + prepTime * 60000),
        readyTime: new Date(startTime.getTime() + totalItemTime * 60000),
        estimatedMinutes: totalItemTime
      };
      
      cumulativeTime += totalItemTime;
      return timeline;
    });

    times[stationName] = {
      estimatedStart: stationStartTime,
      estimatedComplete: new Date(stationStartTime.getTime() + cumulativeTime * 60000),
      totalTime: cumulativeTime,
      items: itemTimeline
    };
  });

  return times;
}

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Connect DB and start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Seed menu if empty
    seedMenuIfEmpty().catch((e) => console.error('Seed menu error:', e));
    seedStockIfEmpty().catch((e) => console.error('Seed stock error:', e));
    app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function seedMenuIfEmpty() {
  const count = await MenuItem.estimatedDocumentCount();
  if (count > 0) return;
  const data = [
    // Mamak mains
    {
      foodId: 'm1', name: 'Roti Canai', category: 'mains', price: 2.0,
      imageUrl: 'https://images.unsplash.com/photo-1615898292623-b2f2f20bfa3f?q=80&w=1200&auto=format&fit=crop',
      stockNeeds: [
        { name: 'Flour', unit: 'kg', quantity: 0.05 },
        { name: 'Ghee', unit: 'g', quantity: 10 },
        { name: 'Eggs', unit: 'pcs', quantity: 0 }
      ]
    },
    {
      foodId: 'm2', name: 'Nasi Lemak', category: 'mains', price: 6.5,
      imageUrl: 'https://images.unsplash.com/photo-1604908554049-1b3dc9bd3454?q=80&w=1200&auto=format&fit=crop',
      stockNeeds: [
        { name: 'Rice', unit: 'kg', quantity: 0.12 },
        { name: 'Coconut milk', unit: 'ml', quantity: 80 },
        { name: 'Sambal', unit: 'g', quantity: 50 },
        { name: 'Anchovies', unit: 'g', quantity: 20 }
      ]
    },
    {
      foodId: 'm3', name: 'Mee Goreng', category: 'mains', price: 6.0,
      imageUrl: 'https://images.unsplash.com/photo-1625944527554-3a0717eca21a?q=80&w=1200&auto=format&fit=crop',
      stockNeeds: [
        { name: 'Yellow noodles', unit: 'g', quantity: 180 },
        { name: 'Eggs', unit: 'pcs', quantity: 1 },
        { name: 'Vegetables mix', unit: 'g', quantity: 60 }
      ]
    },
    {
      foodId: 'm4', name: 'Maggi Goreng', category: 'mains', price: 5.5,
      imageUrl: 'https://images.unsplash.com/photo-1617093727343-37452a7ed2fa?q=80&w=1200&auto=format&fit=crop',
      stockNeeds: [
        { name: 'Maggi noodles', unit: 'g', quantity: 150 },
        { name: 'Eggs', unit: 'pcs', quantity: 1 },
        { name: 'Vegetables mix', unit: 'g', quantity: 60 }
      ]
    },
    {
      foodId: 'm5', name: 'Roti Telur', category: 'mains', price: 3.0,
      imageUrl: 'https://images.unsplash.com/photo-1604908176997-43162b98a9a3?q=80&w=1200&auto=format&fit=crop',
      stockNeeds: [
        { name: 'Flour', unit: 'kg', quantity: 0.05 },
        { name: 'Ghee', unit: 'g', quantity: 10 },
        { name: 'Eggs', unit: 'pcs', quantity: 1 }
      ]
    },
    // Drinks
    {
      foodId: 'd1', name: 'Teh Tarik', category: 'drinks', price: 2.2,
      imageUrl: 'https://images.unsplash.com/photo-1604908812711-7402972a973e?q=80&w=1200&auto=format&fit=crop',
      stockNeeds: [
        { name: 'Tea', unit: 'g', quantity: 5 },
        { name: 'Condensed milk', unit: 'ml', quantity: 40 },
        { name: 'Water', unit: 'ml', quantity: 180 }
      ]
    },
    {
      foodId: 'd2', name: 'Milo Ais', category: 'drinks', price: 3.0,
      imageUrl: 'https://images.unsplash.com/photo-1544124499-45f5099137c1?q=80&w=1200&auto=format&fit=crop',
      stockNeeds: [
        { name: 'Milo powder', unit: 'g', quantity: 20 },
        { name: 'Condensed milk', unit: 'ml', quantity: 30 },
        { name: 'Water', unit: 'ml', quantity: 200 }
      ]
    },
    {
      foodId: 'd3', name: 'Sirap Bandung', category: 'drinks', price: 2.8,
      imageUrl: 'https://images.unsplash.com/photo-1613478223719-5e0b2c718376?q=80&w=1200&auto=format&fit=crop',
      stockNeeds: [
        { name: 'Rose syrup', unit: 'ml', quantity: 25 },
        { name: 'Evaporated milk', unit: 'ml', quantity: 80 },
        { name: 'Water', unit: 'ml', quantity: 180 }
      ]
    }
  ];
  await MenuItem.insertMany(data);
  console.log(`Seeded ${data.length} menu items`);
}

async function seedStockIfEmpty() {
  const count = await StockItem.estimatedDocumentCount();
  if (count > 0) return;
  const stock = [
    { name: 'Flour', unit: 'kg', quantityAvailable: 25 },
    { name: 'Ghee', unit: 'kg', quantityAvailable: 5 },
    { name: 'Eggs', unit: 'pcs', quantityAvailable: 360 },
    { name: 'Rice', unit: 'kg', quantityAvailable: 50 },
    { name: 'Coconut milk', unit: 'L', quantityAvailable: 15 },
    { name: 'Sambal', unit: 'kg', quantityAvailable: 8 },
    { name: 'Anchovies', unit: 'kg', quantityAvailable: 4 },
    { name: 'Yellow noodles', unit: 'kg', quantityAvailable: 20 },
    { name: 'Vegetables mix', unit: 'kg', quantityAvailable: 12 },
    { name: 'Maggi noodles', unit: 'kg', quantityAvailable: 10 },
    { name: 'Tea', unit: 'kg', quantityAvailable: 3 },
    { name: 'Condensed milk', unit: 'L', quantityAvailable: 20 },
    { name: 'Water', unit: 'L', quantityAvailable: 500 },
    { name: 'Milo powder', unit: 'kg', quantityAvailable: 6 },
    { name: 'Rose syrup', unit: 'L', quantityAvailable: 5 },
    { name: 'Evaporated milk', unit: 'L', quantityAvailable: 18 }
  ];
  await StockItem.insertMany(stock);
  console.log(`Seeded ${stock.length} stock items`);
}

// Lambda handler function
export const handler = async (event, context) => {
  // Connect to MongoDB if not already connected
  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB');
      // Seed data if needed
      await seedMenuIfEmpty();
      await seedStockIfEmpty();
    } catch (err) {
      console.error('MongoDB connection error:', err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database connection failed' })
      };
    }
  }

  // Use serverless-http to wrap the Express app
  const serverless = await import('serverless-http');
  const serverlessHandler = serverless.default(app);
  
  return serverlessHandler(event, context);
};

