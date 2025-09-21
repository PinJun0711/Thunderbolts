// Script to save forecast data to MongoDB
// Run this script to save your forecast data: node save-forecast-data.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set');
  process.exit(1);
}

// Forecast Schema
const ForecastSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    dishes: [{
      foodId: { type: String, required: true },
      FoodName: { type: String, required: true },
      "7-Day Forecast": { type: Number, required: true },
      "30-Day Forecast": { type: Number, required: true }
    }],
    stock: [{
      Ingredient: { type: String, required: true },
      Unit: { type: String, required: true },
      "7-Day Usage": { type: Number, required: true },
      "30-Day Usage": { type: Number, required: true }
    }],
    daily: mongoose.Schema.Types.Mixed // Store the daily forecast arrays
  },
  { timestamps: true }
);

const Forecast = mongoose.model('Prediction', ForecastSchema);

// Your forecast data
const forecastData = {
  "_id": {
    "$oid": "68cf7557f32fd8a4ea83c51e"
  },
  "timestamp": {
    "$date": "2025-09-21T03:47:35.765Z"
  },
  "dishes": [
    {
      "foodId": "d3",
      "FoodName": "Sirap Bandung",
      "7-Day Forecast": 18,
      "30-Day Forecast": 46
    },
    {
      "foodId": "m3",
      "FoodName": "Mee Goreng",
      "7-Day Forecast": 7,
      "30-Day Forecast": 30
    },
    {
      "foodId": "d1",
      "FoodName": "Teh Tarik",
      "7-Day Forecast": 14,
      "30-Day Forecast": 53
    },
    {
      "foodId": "m2",
      "FoodName": "Nasi Lemak",
      "7-Day Forecast": 8,
      "30-Day Forecast": 31
    },
    {
      "foodId": "m5",
      "FoodName": "Roti Telur",
      "7-Day Forecast": 7,
      "30-Day Forecast": 30
    },
    {
      "foodId": "d2",
      "FoodName": "Milo Ais",
      "7-Day Forecast": 7,
      "30-Day Forecast": 30
    },
    {
      "foodId": "m4",
      "FoodName": "Maggi Goreng",
      "7-Day Forecast": 7,
      "30-Day Forecast": 30
    },
    {
      "foodId": "m1",
      "FoodName": "Roti Canai",
      "7-Day Forecast": 7,
      "30-Day Forecast": 30
    }
  ],
  "stock": [
    {
      "Ingredient": "Rose syrup",
      "Unit": "ml",
      "7-Day Usage": 450,
      "30-Day Usage": 1150
    },
    {
      "Ingredient": "Sambal",
      "Unit": "g",
      "7-Day Usage": 400,
      "30-Day Usage": 1550
    },
    {
      "Ingredient": "Tea",
      "Unit": "g",
      "7-Day Usage": 70,
      "30-Day Usage": 265
    },
    {
      "Ingredient": "Water",
      "Unit": "ml",
      "7-Day Usage": 7160,
      "30-Day Usage": 23820
    },
    {
      "Ingredient": "Rice",
      "Unit": "kg",
      "7-Day Usage": 0.96,
      "30-Day Usage": 3.72
    },
    {
      "Ingredient": "Coconut milk",
      "Unit": "ml",
      "7-Day Usage": 640,
      "30-Day Usage": 2480
    },
    {
      "Ingredient": "Milo powder",
      "Unit": "g",
      "7-Day Usage": 140,
      "30-Day Usage": 600
    },
    {
      "Ingredient": "Vegetables mix",
      "Unit": "g",
      "7-Day Usage": 840,
      "30-Day Usage": 3600
    },
    {
      "Ingredient": "Eggs",
      "Unit": "pcs",
      "7-Day Usage": 21,
      "30-Day Usage": 90
    },
    {
      "Ingredient": "Condensed milk",
      "Unit": "ml",
      "7-Day Usage": 770,
      "30-Day Usage": 3020
    },
    {
      "Ingredient": "Anchovies",
      "Unit": "g",
      "7-Day Usage": 160,
      "30-Day Usage": 620
    },
    {
      "Ingredient": "Ghee",
      "Unit": "g",
      "7-Day Usage": 140,
      "30-Day Usage": 600
    },
    {
      "Ingredient": "Evaporated milk",
      "Unit": "ml",
      "7-Day Usage": 1440,
      "30-Day Usage": 3680
    },
    {
      "Ingredient": "Flour",
      "Unit": "kg",
      "7-Day Usage": 0.7,
      "30-Day Usage": 3
    },
    {
      "Ingredient": "Yellow noodles",
      "Unit": "g",
      "7-Day Usage": 1260,
      "30-Day Usage": 5400
    },
    {
      "Ingredient": "Maggi noodles",
      "Unit": "g",
      "7-Day Usage": 1050,
      "30-Day Usage": 4500
    }
  ],
  "daily": {
    "d3": {
      "7d": [
        2,
        2,
        2,
        3,
        3,
        3,
        3
      ],
      "30d": [
        2,
        2,
        2,
        3,
        3,
        3,
        3,
        3,
        2,
        2,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        2
      ]
    },
    "m3": {
      "7d": [
        1,
        1,
        1,
        1,
        1,
        1,
        1
      ],
      "30d": [
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1
      ]
    },
    "d1": {
      "7d": [
        4,
        3,
        2,
        2,
        1,
        1,
        1
      ],
      "30d": [
        4,
        3,
        2,
        2,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        2,
        2,
        2,
        2,
        2,
        3,
        4,
        4,
        3,
        2
      ]
    },
    "m2": {
      "7d": [
        1,
        1,
        1,
        1,
        1,
        1,
        2
      ],
      "30d": [
        1,
        1,
        1,
        1,
        1,
        1,
        2,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1
      ]
    },
    "m5": {
      "7d": [
        1,
        1,
        1,
        1,
        1,
        1,
        1
      ],
      "30d": [
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1
      ]
    },
    "d2": {
      "7d": [
        1,
        1,
        1,
        1,
        1,
        1,
        1
      ],
      "30d": [
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1
      ]
    },
    "m4": {
      "7d": [
        1,
        1,
        1,
        1,
        1,
        1,
        1
      ],
      "30d": [
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1
      ]
    },
    "m1": {
      "7d": [
        1,
        1,
        1,
        1,
        1,
        1,
        1
      ],
      "30d": [
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1
      ]
    }
  }
};

async function saveForecastData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove the _id field as MongoDB will generate a new one
    const dataToSave = { ...forecastData };
    delete dataToSave._id;

    // Save the forecast data
    const forecast = new Forecast(dataToSave);
    await forecast.save();

    console.log('✅ Forecast data saved successfully!');
    console.log('📊 Data includes:');
    console.log(`   - ${forecastData.dishes.length} dishes forecast`);
    console.log(`   - ${forecastData.stock.length} ingredients forecast`);
    console.log(`   - Daily trends for ${Object.keys(forecastData.daily).length} dishes`);
    console.log(`   - Generated at: ${new Date(forecastData.timestamp.$date).toLocaleString()}`);

  } catch (error) {
    console.error('❌ Error saving forecast data:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
saveForecastData();
