# Deploy to correct region (ap-southeast-5)

Write-Host "Setting region to ap-southeast-5..." -ForegroundColor Green
$env:AWS_DEFAULT_REGION = "ap-southeast-5"

Write-Host "Deploying to ap-southeast-5..." -ForegroundColor Yellow
serverless deploy --stage prod --region ap-southeast-5

Write-Host "Deployment complete!" -ForegroundColor Green
