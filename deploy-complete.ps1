# Complete Thunderbolts Orders + SageMaker Deployment

Write-Host "🚀 Starting complete AWS deployment..." -ForegroundColor Green

# Check if AWS CLI is configured
try {
    aws sts get-caller-identity | Out-Null
    Write-Host "✅ AWS CLI is configured" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Set environment variables
$env:MONGODB_URI = "mongodb+srv://pinjun040711:Dxda6769@cluster0.pq1ueqp.mongodb.net/thunderbolts_orders?retryWrites=true&w=majority"
$env:AWS_DEFAULT_REGION = "ap-southeast-5"

Write-Host "🔧 Deploying complete architecture..." -ForegroundColor Yellow
Write-Host "This includes:" -ForegroundColor Cyan
Write-Host "- API Gateway + Lambda" -ForegroundColor White
Write-Host "- S3 bucket for training data" -ForegroundColor White
Write-Host "- SageMaker integration" -ForegroundColor White
Write-Host "- IAM roles and permissions" -ForegroundColor White

serverless deploy --config serverless-complete.yml --stage prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Complete deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Your complete architecture is now live!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Available endpoints:" -ForegroundColor Yellow
    Write-Host "- Main App: [API_URL]/" -ForegroundColor White
    Write-Host "- Health Check: [API_URL]/api/health" -ForegroundColor White
    Write-Host "- Menu: [API_URL]/api/menu" -ForegroundColor White
    Write-Host "- Orders: [API_URL]/api/orders" -ForegroundColor White
    Write-Host "- Train Model: [API_URL]/api/sagemaker/train" -ForegroundColor White
    Write-Host "- Training Status: [API_URL]/api/sagemaker/status" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Check the output above for your API Gateway URL" -ForegroundColor White
    Write-Host "🗄️ S3 bucket created for training data export" -ForegroundColor White
    Write-Host "🧠 SageMaker ready for model training" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}
