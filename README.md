# Thunderbolts Orders

Simple staff-facing web interface to create customer orders and send to the kitchen, storing data in MongoDB Atlas.

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
