import mongoose from 'mongoose';

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
};

// Menu schema
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
    const items = await MenuItem.find().sort({ category: 1, name: 1 });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(items),
    };
  } catch (err) {
    console.error('Get menu error:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to fetch menu' }),
    };
  }
};
