import mongoose from 'mongoose';

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
};

// Stock schema
const StockItemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  unit: { type: String, required: true },
  quantityAvailable: { type: Number, required: true, default: 0 }
}, { timestamps: true });

const StockItem = mongoose.model('StockItem', StockItemSchema);

export const handler = async (event, context) => {
  try {
    await connectDB();
    const items = await StockItem.find().sort({ name: 1 });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(items),
    };
  } catch (err) {
    console.error('Get stock error:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to fetch stock' }),
    };
  }
};
