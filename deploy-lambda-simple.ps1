Write-Host "Starting AWS Lambda deployment..." -ForegroundColor Green

# Set environment variable
$env:MONGODB_URI = "mongodb+srv://pinjun040711:Dxda6769@cluster0.pq1ueqp.mongodb.net/thunderbolts_orders?retryWrites=true&w=majority"

Write-Host "Deploying to AWS Lambda..." -ForegroundColor Yellow
serverless deploy --stage prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment successful!" -ForegroundColor Green
} else {
    Write-Host "Deployment failed" -ForegroundColor Red
}
