import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { SageMakerClient, CreateTrainingJobCommand } from "@aws-sdk/client-sagemaker";
import mongoose from 'mongoose';

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-southeast-5' });
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
    
    const { httpMethod } = event;
    
    if (httpMethod === 'POST') {
      return await exportDataAndTrain();
    } else if (httpMethod === 'GET') {
      return await getTrainingStatus();
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
    console.error('SageMaker training error:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Training failed' }),
    };
  }
};

async function exportDataAndTrain() {
  try {
    // Export orders to S3
    const orders = await Order.find().lean();
    const timestamp = Date.now();
    const s3Key = `training-data/orders-${timestamp}.json`;
    
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET || 'thunderbolts-training-data',
      Key: s3Key,
      Body: JSON.stringify(orders, null, 2),
      ContentType: 'application/json'
    }));
    
    console.log(`Exported ${orders.length} orders to S3: s3://${process.env.S3_BUCKET}/${s3Key}`);
    
    // Start SageMaker training job
    const trainingJobName = `thunderbolts-training-${timestamp}`;
    
    const trainingParams = {
      TrainingJobName: trainingJobName,
      RoleArn: process.env.SAGEMAKER_ROLE_ARN,
      AlgorithmSpecification: {
        TrainingInputMode: 'File',
        TrainingImage: 'your-sagemaker-image-uri' // Replace with your actual image
      },
      InputDataConfig: [{
        ChannelName: 'training',
        DataSource: {
          S3DataSource: {
            S3DataType: 'S3Prefix',
            S3Uri: `s3://${process.env.S3_BUCKET}/${s3Key}`,
            S3DataDistributionType: 'FullyReplicated'
          }
        }
      }],
      OutputDataConfig: {
        S3OutputPath: `s3://${process.env.S3_BUCKET}/models/`
      },
      ResourceConfig: {
        InstanceType: 'ml.m5.large',
        InstanceCount: 1,
        VolumeSizeInGB: 30
      },
      StoppingCondition: {
        MaxRuntimeInSeconds: 3600
      }
    };
    
    await sagemaker.send(new CreateTrainingJobCommand(trainingParams));
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        message: 'Training job started successfully',
        trainingJobName: trainingJobName,
        s3DataKey: s3Key,
        ordersExported: orders.length
      }),
    };
  } catch (err) {
    console.error('Export and training error:', err);
    throw err;
  }
}

async function getTrainingStatus() {
  // This would check the status of training jobs
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ 
      message: 'Training status endpoint - implement as needed'
    }),
  };
}
