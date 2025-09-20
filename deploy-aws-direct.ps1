# Deploy directly to AWS without Serverless Framework

Write-Host "Deploying directly to AWS Lambda..." -ForegroundColor Green

# Check if AWS CLI is configured
try {
    aws sts get-caller-identity | Out-Null
    Write-Host "AWS CLI is configured" -ForegroundColor Green
} catch {
    Write-Host "AWS CLI not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Set region
$env:AWS_DEFAULT_REGION = "ap-southeast-5"

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
Compress-Archive -Path "server.js", "package.json", "public", "handlers" -DestinationPath "thunderbolts-aws-direct.zip" -Force

# Create Lambda function
Write-Host "Creating Lambda function..." -ForegroundColor Yellow
aws lambda create-function `
  --function-name thunderbolts-orders-direct `
  --runtime nodejs20.x `
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role `
  --handler server.handler `
  --zip-file fileb://thunderbolts-aws-direct.zip `
  --region ap-southeast-5

Write-Host "Setting environment variables..." -ForegroundColor Yellow
aws lambda update-function-configuration `
  --function-name thunderbolts-orders-direct `
  --environment Variables='{NODE_ENV=production,MONGODB_URI=mongodb+srv://pinjun040711:Dxda6769@cluster0.pq1ueqp.mongodb.net/thunderbolts_orders?retryWrites=true&w=majority}' `
  --region ap-southeast-5

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Now create API Gateway manually in AWS Console" -ForegroundColor Cyan
