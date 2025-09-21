const AWS = require('aws-sdk');

// Initialize SageMaker Runtime
const sagemakerRuntime = new AWS.SageMakerRuntime({
  region: process.env.AWS_REGION || 'ap-southeast-5'
});

exports.handler = async (event, context) => {
  try {
    const { items } = JSON.parse(event.body);
    
    if (!items || !Array.isArray(items)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Items array is required' })
      };
    }

    // Prepare data for SageMaker LSTM model
    const predictions = await Promise.all(items.map(async (item) => {
      try {
        // Prepare input data for LSTM model
        const inputData = {
          item_name: item.name,
          current_stock: item.currentStock || 0,
          unit: item.unit,
          // Add more features as needed by your LSTM model
          historical_data: await getHistoricalData(item.name) // You'll need to implement this
        };

        // Call SageMaker endpoint
        const params = {
          EndpointName: process.env.SAGEMAKER_ENDPOINT || 'thunderbolts-lstm-forecast',
          ContentType: 'application/json',
          Body: JSON.stringify(inputData)
        };

        const response = await sagemakerRuntime.invokeEndpoint(params).promise();
        const result = JSON.parse(response.Body.toString());

        // Process LSTM predictions
        const predicted7days = result.prediction_7_days || 0;
        const predicted30days = result.prediction_30_days || 0;
        
        // Generate recommendations based on predictions
        let recommendation = 'Good';
        if (predicted7days <= 0) {
          recommendation = 'Restock';
        } else if (predicted30days <= 10) {
          recommendation = 'Monitor';
        }

        return {
          name: item.name,
          currentStock: item.currentStock || 0,
          predicted7days: predicted7days,
          predicted30days: predicted30days,
          recommendation: recommendation,
          unit: item.unit,
          confidence: result.confidence || 0.8,
          model_used: 'LSTM'
        };

      } catch (error) {
        console.error(`Error predicting for ${item.name}:`, error);
        
        // Fallback to simple heuristic if SageMaker fails
        const currentStock = item.currentStock || 0;
        const predicted7days = Math.max(0, currentStock - 5); // Simple fallback
        const predicted30days = Math.max(0, currentStock - 20);
        
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
          unit: item.unit,
          confidence: 0.5,
          model_used: 'Heuristic (SageMaker unavailable)',
          error: error.message
        };
      }
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        predictions: predictions,
        generated_at: new Date().toISOString(),
        model_info: {
          endpoint: process.env.SAGEMAKER_ENDPOINT || 'thunderbolts-lstm-forecast',
          region: process.env.AWS_REGION || 'ap-southeast-5'
        }
      })
    };

  } catch (error) {
    console.error('SageMaker forecast error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to generate forecast',
        details: error.message
      })
    };
  }
};

// Helper function to get historical data for LSTM model
async function getHistoricalData(itemName) {
  // This would typically query your database for historical stock levels
  // For now, return mock data
  return {
    daily_usage: [2, 3, 1, 4, 2, 3, 5], // Last 7 days usage
    weekly_pattern: [15, 18, 12, 20, 16, 14, 19], // Last 7 weeks
    seasonal_factor: 1.2,
    trend: 'increasing'
  };
}

