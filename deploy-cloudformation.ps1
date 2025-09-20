# Deploy with AWS CloudFormation (No SAM CLI needed)

Write-Host "Deploying with AWS CloudFormation..." -ForegroundColor Green

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
Compress-Archive -Path "server.js", "package.json", "public", "handlers" -DestinationPath "thunderbolts-cloudformation.zip" -Force

# Upload to S3 (for CloudFormation)
Write-Host "Uploading to S3..." -ForegroundColor Yellow
aws s3 cp thunderbolts-cloudformation.zip s3://thunderbolts-deployment-bucket/

# Deploy CloudFormation stack
Write-Host "Deploying CloudFormation stack..." -ForegroundColor Yellow
aws cloudformation deploy --template-file template.yaml --stack-name thunderbolts-orders --capabilities CAPABILITY_IAM --region ap-southeast-5

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Check AWS Console for your API Gateway URL" -ForegroundColor Cyan
