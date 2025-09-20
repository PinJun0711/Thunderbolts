#!/bin/bash

# Thunderbolts Orders - AWS Elastic Beanstalk Deployment Script

echo "🚀 Starting deployment to AWS Elastic Beanstalk..."

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo "❌ AWS EB CLI not found. Please install it first:"
    echo "   pip install awsebcli"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Initialize EB application if not already done
if [ ! -d ".elasticbeanstalk" ]; then
    echo "📝 Initializing Elastic Beanstalk application..."
    eb init thunderbolts-orders --platform node.js --region us-east-1
fi

# Create environment if it doesn't exist
echo "🌍 Creating/updating Elastic Beanstalk environment..."
eb deploy thunderbolts-orders-env || eb create thunderbolts-orders-env

echo "✅ Deployment complete!"
echo "🔗 Your application URL:"
eb status
