// Test script to verify the forecast API endpoints
// Run this after saving your data: node test-forecast-api.js

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:80'; // Adjust if your server runs on a different port

async function testForecastAPI() {
  console.log('🧪 Testing Forecast API Endpoints...\n');

  try {
    // Test 1: Get latest forecast data
    console.log('1️⃣ Testing GET /api/forecast/latest');
    const response = await fetch(`${BASE_URL}/api/forecast/latest`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Retrieved forecast data:');
      console.log(`   - Timestamp: ${new Date(data.timestamp).toLocaleString()}`);
      console.log(`   - Dishes: ${data.dishes.length} items`);
      console.log(`   - Stock: ${data.stock.length} ingredients`);
      console.log(`   - Daily data: ${Object.keys(data.daily).length} dishes`);
      
      // Show sample dish forecast
      if (data.dishes.length > 0) {
        const sampleDish = data.dishes[0];
        console.log(`   - Sample: ${sampleDish.FoodName} - 7d: ${sampleDish["7-Day Forecast"]}, 30d: ${sampleDish["30-Day Forecast"]}`);
      }
    } else if (response.status === 404) {
      console.log('❌ No forecast data found. Please run save-forecast-data.js first.');
    } else {
      console.log(`❌ Error: ${response.status} ${response.statusText}`);
    }

    console.log('\n2️⃣ Testing POST /api/forecast/save (validation)');
    const testData = {
      dishes: [{ foodId: 'test', FoodName: 'Test Dish', "7-Day Forecast": 5, "30-Day Forecast": 20 }],
      stock: [{ Ingredient: 'Test Ingredient', "7-Day Usage": 10, "30-Day Usage": 40 }],
      daily: { test: { "7d": [1,2,3], "30d": [1,2,3,4,5] } }
    };

    const saveResponse = await fetch(`${BASE_URL}/api/forecast/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (saveResponse.ok) {
      console.log('✅ Save endpoint working correctly');
    } else {
      console.log(`❌ Save endpoint error: ${saveResponse.status}`);
    }

    console.log('\n3️⃣ Testing health endpoint');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    if (healthResponse.ok) {
      console.log('✅ Server is running and healthy');
    } else {
      console.log('❌ Server health check failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your server is running on the correct port');
  }
}

// Run the tests
testForecastAPI();
