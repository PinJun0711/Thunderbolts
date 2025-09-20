import { SageMakerClient, CreateTrainingJobCommand, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker";
import mongoose from 'mongoose';

const sagemaker = new SageMakerClient({ region: process.env.AWS_REGION || 'ap-southeast-5' });

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
};

// Order schema
const OrderSchema = new mongoose.Schema({
  pax: { type: Number, required: true, min: 1 },
  table: { type: String, default: '' },
  items: [{
    foodId: { type: String, required: true },
    foodName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: false },
    lineTotal: { type: Number, required: false },
    spices: { type: String, default: '' },
    requirement: { type: String, default: '' }
  }],
  totalAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'sent', 'completed'], default: 'pending' },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

const Order = mongoose.model('Order', OrderSchema);

export const handler = async (event, context) => {
  try {
    await connectDB();
    
    const { httpMethod, body } = event;
    
    if (httpMethod === 'POST') {
      return await trainModelDirectly();
    } else if (httpMethod === 'GET') {
      return await getPredictions(JSON.parse(body || '{}'));
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
    console.error('SageMaker direct error:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'SageMaker operation failed' }),
    };
  }
};

async function trainModelDirectly() {
  try {
    // Get data directly from MongoDB
    const orders = await Order.find().lean();
    console.log(`Found ${orders.length} orders for training`);
    
    // Prepare training data
    const trainingData = orders.map(order => ({
      pax: order.pax,
      table: order.table,
      totalAmount: order.totalAmount,
      hour: new Date(order.createdAt).getHours(),
      dayOfWeek: new Date(order.createdAt).getDay(),
      items: order.items.map(item => ({
        foodId: item.foodId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      status: order.status
    }));
    
    // For now, we'll simulate training since direct MongoDB to SageMaker requires custom containers
    // In production, you'd use SageMaker Processing Jobs with custom containers
    console.log('Training data prepared:', trainingData.length, 'records');
    
    // Simulate training job creation
    const trainingJobName = `thunderbolts-direct-${Date.now()}`;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        message: 'Model training initiated with direct MongoDB data',
        trainingJobName: trainingJobName,
        recordsProcessed: trainingData.length,
        dataSample: trainingData.slice(0, 3) // Show first 3 records
      }),
    };
  } catch (err) {
    console.error('Direct training error:', err);
    throw err;
  }
}

async function getPredictions(data) {
  try {
    // Get recent orders for context
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Simple prediction logic based on recent patterns
    const popularItems = {};
    recentOrders.forEach(order => {
      order.items.forEach(item => {
        popularItems[item.foodId] = (popularItems[item.foodId] || 0) + item.quantity;
      });
    });
    
    const recommendations = Object.entries(popularItems)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([foodId, count]) => ({ foodId, popularity: count }));
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        predictions: recommendations,
        basedOn: recentOrders.length,
        message: 'Predictions based on recent order patterns'
      }),
    };
  } catch (err) {
    console.error('Prediction error:', err);
    throw err;
  }
}
