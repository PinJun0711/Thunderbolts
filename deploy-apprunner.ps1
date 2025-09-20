# Thunderbolts Orders - AWS App Runner Deployment Script

# Configuration
$REGION = "ap-southeast-1"  # Change to your preferred region
$REPO = "thunderbolts-app"
$IMAGE_TAG = "latest"

Write-Host "🚀 Starting AWS App Runner deployment..." -ForegroundColor Green

# Check if Docker is running
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if AWS CLI is available
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI is available" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Get AWS Account ID
try {
    $ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
    Write-Host "✅ AWS Account ID: $ACCOUNT_ID" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Build Docker image
Write-Host "🔨 Building Docker image..." -ForegroundColor Yellow
docker build -t thunderbolts-app .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

# Create ECR repository (ignore if already exists)
Write-Host "📦 Creating ECR repository..." -ForegroundColor Yellow
aws ecr create-repository --repository-name $REPO --region $REGION 2>$null

# Login to ECR
Write-Host "🔐 Logging into ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

# Tag and push image
$ECR_URI = "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO}:${IMAGE_TAG}"
Write-Host "🏷️ Tagging image as $ECR_URI" -ForegroundColor Yellow
docker tag thunderbolts-app:latest $ECR_URI

Write-Host "📤 Pushing image to ECR..." -ForegroundColor Yellow
docker push $ECR_URI

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Image pushed successfully!" -ForegroundColor Green
    Write-Host "🎯 ECR Image URI: $ECR_URI" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Go to AWS App Runner Console" -ForegroundColor White
    Write-Host "2. Create service with source: Container registry" -ForegroundColor White
    Write-Host "3. Use this image URI: ${ECR_URI}" -ForegroundColor White
    Write-Host "4. Set environment variables:" -ForegroundColor White
    Write-Host "   - NODE_ENV=production" -ForegroundColor White
    Write-Host "   - MONGODB_URI=mongodb+srv://pinjun040711:Dxda6769@cluster0.pq1ueqp.mongodb.net/thunderbolts_orders?retryWrites=true&w=majority" -ForegroundColor White
    Write-Host "5. Set port: 3000" -ForegroundColor White
    Write-Host "6. Set health check path: /api/health" -ForegroundColor White
} else {
    Write-Host "❌ Failed to push image to ECR" -ForegroundColor Red
    exit 1
}
