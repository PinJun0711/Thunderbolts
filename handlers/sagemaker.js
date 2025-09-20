import { SageMakerClient, InvokeEndpointCommand } from '@aws-sdk/client-sagemaker-runtime';

const sagemakerClient = new SageMakerClient({ region: process.env.AWS_REGION || 'ap-southeast-5' });

export const handler = async (event, context) => {
  try {
    const { httpMethod, body } = event;
    
    if (httpMethod === 'POST') {
      return await trainModel(JSON.parse(body || '{}'));
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
    console.error('SageMaker handler error:', err);
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

async function trainModel(data) {
  // This would trigger a SageMaker training job
  // For now, we'll return a mock response
  console.log('Training model with data:', data);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ 
      message: 'Model training initiated',
      jobId: 'mock-training-job-' + Date.now()
    }),
  };
}

async function getPredictions(data) {
  // This would call a SageMaker endpoint for predictions
  // For now, we'll return mock predictions
  console.log('Getting predictions for data:', data);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ 
      predictions: [
        { item: 'Roti Canai', confidence: 0.85, recommendation: 'high' },
        { item: 'Nasi Lemak', confidence: 0.72, recommendation: 'medium' }
      ]
    }),
  };
}
