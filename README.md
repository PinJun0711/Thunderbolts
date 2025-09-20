# Thunderbolts Orders

Simple staff-facing web interface to create customer orders and send to kitchen, storing data in MongoDB Atlas.

## Quick start (Local Development)

1. Create `.env` in project root:

```
MONGODB_URI=mongodb+srv://pinjun040711:Dxda6769@cluster0.pq1ueqp.mongodb.net/thunderbolts_orders?retryWrites=true&w=majority
PORT=3000
```

2. Install dependencies and run:

```
npm install
npm run dev
```

3. Open the app:

- Visit `http://localhost:3000` for the order form
- API endpoints:
  - `POST /api/orders` to create orders
  - `GET /api/orders` to list recent orders

## AWS Amplify Deployment

### Prerequisites

1. AWS Account with Amplify access
2. GitHub repository (optional, can use direct upload)

### Deploy to AWS Amplify

1. **Go to AWS Amplify Console**: https://console.aws.amazon.com/amplify/
2. **Create App**:
   - Click "New app" → "Host web app"
   - Choose "Deploy without Git provider" (or connect GitHub if preferred)
   - Upload your project as a ZIP file

3. **Configure Build Settings**:
   - The `amplify.yml` file is already configured
   - Environment variables will be set in the console

4. **Set Environment Variables**:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `mongodb+srv://pinjun040711:Dxda6769@cluster0.pq1ueqp.mongodb.net/thunderbolts_orders?retryWrites=true&w=majority`

5. **Deploy**:
   - Click "Save and deploy"
   - Wait for build to complete (5-10 minutes)

### Application URL

After deployment, Amplify will provide you with a public URL like:
`https://main.d1234567890.amplifyapp.com`

### Automatic Deployments

If you connect a GitHub repository, Amplify will automatically redeploy when you push changes to your main branch.

## Payload example

```
POST /api/orders
Content-Type: application/json

{
  "pax": 2,
  "items": [
    { "foodId": "f1", "foodName": "Fried Rice", "quantity": 2, "spices": "mild", "requirement": "no peanuts" },
    { "foodId": "f2", "foodName": "Chicken Chop", "quantity": 1, "spices": "extra chili", "requirement": "less oil" }
  ]
}
```

## Notes

- Food choices are hardcoded client-side for now and can be replaced later with a menu collection.
- Orders are saved with fields: `pax`, `items[]` (with `foodId`, `foodName`, `quantity`, `spices`, `requirement`), and timestamps.
