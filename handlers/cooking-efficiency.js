import mongoose from 'mongoose';

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
};

// Order schemas
const OrderItemSchema = new mongoose.Schema({
  foodId: { type: String, required: true },
  foodName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: false },
  lineTotal: { type: Number, required: false },
  spices: { type: String, default: '' },
  requirement: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'preparing', 'ready', 'completed', 'sent'], default: 'pending' }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  pax: { type: Number, required: true, min: 1 },
  table: { type: String, default: '' },
  items: { type: [OrderItemSchema], default: [] },
  totalAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'sent', 'completed'], default: 'pending' },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

const Order = mongoose.model('Order', OrderSchema);

// Menu schema for cooking times
const MenuItemSchema = new mongoose.Schema({
  foodId: { type: String, unique: true, index: true },
  name: { type: String, required: true },
  category: { type: String, default: 'food' },
  price: { type: Number, required: true },
  imageUrl: { type: String, default: '' },
  cookingTime: { type: Number, default: 15 }, // in minutes
  preparationTime: { type: Number, default: 5 }, // in minutes
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  stockNeeds: [{
    name: String,
    unit: String,
    quantity: Number
  }]
}, { timestamps: true });

const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

export const handler = async (event, context) => {
  try {
    await connectDB();
    
    const { httpMethod, body } = event;
    
    if (httpMethod === 'GET') {
      return await getOptimalCookingSequence();
    } else if (httpMethod === 'POST') {
      const data = JSON.parse(body || '{}');
      return await updateOrderStatus(data);
    }
    
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (err) {
    console.error('Cooking efficiency handler error:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function getOptimalCookingSequence() {
  try {
    // Get all active orders (not completed)
    const activeOrders = await Order.find({ status: { $ne: 'completed' } })
      .sort({ createdAt: 1 }) // Oldest orders first
      .lean();

    // Get menu items for cooking time data
    const menuItems = await MenuItem.find().lean();
    const menuMap = new Map(menuItems.map(item => [item.foodId, item]));

    // Extract all pending items from active orders
    const pendingItems = [];
    activeOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.status === 'pending' || item.status === 'sent') {
          const menuItem = menuMap.get(item.foodId) || {
            cookingTime: 15,
            preparationTime: 5,
            priority: 'medium'
          };
          
          pendingItems.push({
            ...item,
            orderId: order._id,
            table: order.table,
            pax: order.pax,
            orderCreatedAt: order.createdAt,
            cookingTime: menuItem.cookingTime,
            preparationTime: menuItem.preparationTime,
            priority: menuItem.priority,
            totalTime: menuItem.preparationTime + menuItem.cookingTime
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        cookingSequence: optimizedSequence,
        cookingStations,
        estimatedTimes,
        totalItems: pendingItems.length,
        totalOrders: activeOrders.length,
        generatedAt: new Date().toISOString()
      }),
    };
  } catch (err) {
    console.error('Error generating cooking sequence:', err);
    throw err;
  }
}

function optimizeCookingSequence(items) {
  if (items.length === 0) return [];

  // Multiple optimization strategies
  const strategies = [
    // Strategy 1: Priority-based (high priority items first)
    [...items].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.orderCreatedAt - b.orderCreatedAt; // Earlier orders first
    }),
    
    // Strategy 2: Time-based (shortest cooking time first)
    [...items].sort((a, b) => {
      if (a.totalTime !== b.totalTime) {
        return a.totalTime - b.totalTime;
      }
      return a.orderCreatedAt - b.orderCreatedAt;
    }),
    
    // Strategy 3: Table-based (serve tables in order)
    [...items].sort((a, b) => {
      const tableA = parseInt(a.table) || 999;
      const tableB = parseInt(b.table) || 999;
      if (tableA !== tableB) {
        return tableA - tableB;
      }
      return a.orderCreatedAt - b.orderCreatedAt;
    })
  ];

  // Use a hybrid approach - combine strategies
  const weights = [0.4, 0.3, 0.3]; // Priority, time, table order
  const scored = items.map(item => {
    let score = 0;
    
    // Priority score (higher priority = higher score)
    const priorityScore = { high: 100, medium: 50, low: 0 };
    score += priorityScore[item.priority] * weights[0];
    
    // Time score (shorter time = higher score)
    score += (60 - item.totalTime) * weights[1];
    
    // Table order score (earlier table = higher score)
    const tableNum = parseInt(item.table) || 10;
    score += (11 - tableNum) * 10 * weights[2];
    
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

async function updateOrderStatus(data) {
  const { orderId, itemId, status } = data;

  if (!orderId || !itemId || !status) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'orderId, itemId, and status are required' }),
    };
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Order not found' }),
      };
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: true, 
        message: `Item status updated to ${status}`,
        order: order
      }),
    };
  } catch (err) {
    console.error('Error updating order status:', err);
    throw err;
  }
}
