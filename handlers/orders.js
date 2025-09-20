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
  requirement: { type: String, default: '' }
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

// Menu schema for order processing
const MenuItemSchema = new mongoose.Schema({
  foodId: { type: String, unique: true, index: true },
  name: { type: String, required: true },
  category: { type: String, default: 'food' },
  price: { type: Number, required: true },
  imageUrl: { type: String, default: '' },
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
    
    const { httpMethod, pathParameters, body } = event;
    
    // Handle different HTTP methods
    switch (httpMethod) {
      case 'POST':
        if (event.path.includes('/complete')) {
          return await completeOrder(pathParameters.id);
        } else {
          return await createOrder(JSON.parse(body || '{}'));
        }
      
      case 'GET':
        if (event.path.includes('/active-tables')) {
          return await getActiveTables();
        } else {
          return await getOrders();
        }
      
      default:
        return {
          statusCode: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (err) {
    console.error('Orders handler error:', err);
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

async function createOrder(orderData) {
  const { pax, table, items } = orderData;

  if (!pax || !Array.isArray(items) || items.length === 0) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'pax and items are required' }),
    };
  }

  // Validate table 1-10 if provided
  const tableStr = (table || '').toString().trim();
  if (!tableStr) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'table is required' }),
    };
  }
  
  const tableNum = Number(tableStr);
  if (!Number.isInteger(tableNum) || tableNum < 1 || tableNum > 10) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'table must be an integer 1-10' }),
    };
  }

  // Get menu items for pricing
  const ids = [...new Set(items.map((i) => i.foodId))];
  const menuItems = await MenuItem.find({ foodId: { $in: ids } });
  const idToMenu = new Map(menuItems.map((m) => [m.foodId, m]));

  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  const enriched = items.map((i) => {
    const menu = idToMenu.get(i.foodId);
    const unitPrice = round2(menu ? menu.price : 0);
    const lineTotal = round2(unitPrice * i.quantity);
    return { ...i, unitPrice, lineTotal, foodName: i.foodName || menu?.name || 'Unknown' };
  });
  
  const totalAmount = enriched.reduce((sum, it) => sum + (it.lineTotal || 0), 0);
  const totalAmountRounded = round2(totalAmount);

  const order = await Order.create({ 
    pax, 
    table: tableStr, 
    items: enriched, 
    totalAmount: totalAmountRounded, 
    status: 'sent' 
  });

  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(order),
  };
}

async function getOrders() {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(orders),
  };
}

async function getActiveTables() {
  const pipeline = [
    { $match: { status: { $ne: 'completed' } } },
    { $group: { _id: '$table', activeOrders: { $sum: 1 }, pax: { $sum: '$pax' } } },
    { $project: { table: '$_id', activeOrders: 1, pax: 1, _id: 0 } },
    { $sort: { table: 1 } }
  ];
  
  const results = await Order.aggregate(pipeline);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(results),
  };
}

async function completeOrder(orderId) {
  const order = await Order.findByIdAndUpdate(
    orderId,
    { status: 'completed', completedAt: new Date() },
    { new: true }
  );
  
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

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(order),
  };
}
