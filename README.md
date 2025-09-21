# GenAI-Kitchen 🍽️🤖

*A Generative AI-powered solution for optimizing kitchen operations and inventory management*

## 📌 Overview

GenAI-Kitchen is a hackathon project developed by **Team Thunderbolts** for the **Great Malaysia AI Hackathon 2025**.
The system leverages **Generative AI, Machine Learning (LSTM), and AWS Cloud Services** to streamline kitchen workflows, manage stock efficiently, and enhance customer satisfaction in food & beverage (F&B) businesses.

---

## 🚀 Features

* **AI-Powered Order Prioritization** – dynamically queues orders based on prep time and customer wait time.
* **Real-Time Alerts** – notifies staff when wait times are too long or stock is running low.
* **Smart Inventory Management** – tracks stock levels and predicts future demand.
* **Food Waste Reduction** – forecasts ingredient usage to prevent over-preparation.
* **Interactive Dashboards** – user-friendly interfaces for menu ordering, stock tracking, and cooking efficiency.

---

## 🏗️ System Architecture

* **Frontend:** HTML, CSS, JavaScript (interactive dashboards)
* **Backend:** Node.js + Express, MongoDB (orders, inventory, feedback)
* **Machine Learning (AI Layer):** AWS SageMaker Studio (LSTM model for demand forecasting)
* **Cloud Infrastructure:**

  * AWS EC2 – Application hosting
  * AWS Lambda + API Gateway – AI inference endpoints
  * AWS IAM – Security & permissions

---

## 📊 Data Flow

Orders logged → MongoDB → LSTM Model (SageMaker) → Forecast Results → Lambda + API Gateway → Dashboards updated (order priorities, alerts, restock plans).

---

## 🖥️ Dashboards & User Interfaces

* **Menu Ordering Page:** Table & pax selection, menu browsing, order customization.
* **Stock Management Dashboard:** Monitor stock levels, forecast demand, and receive restock alerts.
* **Cooking Efficiency Dashboard:** Optimized cooking sequence with AI prioritization.

---

## ⚙️ Installation & Setup

1. Clone the repo:

   ```bash
   git clone https://github.com/<your-repo>/GenAI-Kitchen.git
   cd GenAI-Kitchen
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Set up MongoDB connection (update `.env` file with credentials).
4. Deploy ML model on **AWS SageMaker Studio**.
5. Run the server:

   ```bash
   npm start
   ```
6. Access the app at `http://localhost:3000`.

---

## 📈 Business Value

* Automates order workflows → faster service.
* Reduces food waste → saves costs.
* Maintains stock availability → avoids lost sales.
* Increases customer satisfaction & loyalty.

---

## 👨‍💻 Team Thunderbolts

* Yio Lim Hoong (Leader)
* Cha Chu Jun
* Chong Pin Jun
* Lim Wei Jie

---
