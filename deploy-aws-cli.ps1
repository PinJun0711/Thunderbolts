# AWS Lambda Deployment via CLI

Write-Host "Creating Lambda function..." -ForegroundColor Green

# Create Lambda function
aws lambda create-function `
  --function-name thunderbolts-orders `
  --runtime nodejs20.x `
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role `
  --handler server.handler `
  --zip-file fileb://thunderbolts-lambda.zip `
  --region ap-southeast-5

Write-Host "Setting environment variables..." -ForegroundColor Yellow

# Set environment variables
aws lambda update-function-configuration `
  --function-name thunderbolts-orders `
  --environment Variables='{NODE_ENV=production,MONGODB_URI=mongodb+srv://pinjun040711:Dxda6769@cluster0.pq1ueqp.mongodb.net/thunderbolts_orders?retryWrites=true&w=majority}' `
  --region ap-southeast-5

Write-Host "Deployment complete!" -ForegroundColor Green
