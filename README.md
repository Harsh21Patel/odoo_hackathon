# CoreInventory — MERN Stack Inventory Management System

A full-featured, modular Inventory Management System built with MongoDB, Express, React, and Node.js.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+ (local or MongoDB Atlas)

---

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET
```

**Run the dev server:**
```bash
npm run dev
# → Server running on http://localhost:5000
```

**Seed demo data (optional):**
```bash
npm run seed
# Creates: admin@coreinventory.com / admin123
# Adds 2 warehouses, 6 products, sample receipts & deliveries
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
# → App running on http://localhost:3000
```

The frontend proxies `/api` requests to `http://localhost:5000` automatically.

---

## 🗂 Project Structure

```
coreinventory/
├── backend/
│   ├── models/
│   │   ├── User.js          # Auth, roles
│   │   ├── Warehouse.js     # Warehouse + nested locations
│   │   ├── Product.js       # SKU, stock entries per warehouse
│   │   ├── Receipt.js       # Incoming goods
│   │   ├── Delivery.js      # Outgoing goods
│   │   └── StockMove.js     # Full audit ledger
│   ├── routes/
│   │   ├── auth.js          # Register / Login / Profile
│   │   ├── products.js      # CRUD + category filter
│   │   ├── warehouses.js    # CRUD + add locations
│   │   ├── receipts.js      # CRUD + validate (stock +)
│   │   ├── deliveries.js    # CRUD + validate (stock -)
│   │   ├── moves.js         # History, transfer, adjustment
│   │   └── dashboard.js     # KPIs + charts data
│   ├── middleware/
│   │   └── auth.js          # JWT protect middleware
│   ├── server.js
│   ├── seed.js
│   └── .env.example
│
└── frontend/
    └── src/
        ├── context/
        │   └── AuthContext.js
        ├── utils/
        │   ├── api.js          # Axios instance + interceptors
        │   └── helpers.js      # Formatters, color maps
        ├── components/layout/
        │   ├── Layout.js       # Sidebar + main shell
        │   └── Layout.css      # Full design system (tokens, buttons, cards, tables…)
        ├── pages/
        │   ├── LoginPage.js
        │   ├── RegisterPage.js
        │   ├── DashboardPage.js
        │   ├── ProductsPage.js
        │   ├── ReceiptsPage.js
        │   ├── ReceiptDetailPage.js
        │   ├── DeliveriesPage.js
        │   ├── DeliveryDetailPage.js
        │   ├── MoveHistoryPage.js
        │   └── WarehousesPage.js
        └── App.js
```

---

## 🔑 Environment Variables (backend/.env)

| Variable    | Description                             | Default                                   |
|-------------|-----------------------------------------|-------------------------------------------|
| `PORT`      | Server port                             | `5000`                                    |
| `MONGO_URI` | MongoDB connection string               | `mongodb://localhost:27017/coreinventory` |
| `JWT_SECRET`| Secret key for JWT signing              | `your_super_secret_jwt_key_here`          |
| `JWT_EXPIRE`| Token expiry duration                   | `7d`                                      |

---

## 📡 API Endpoints

### Auth
| Method | Path                | Description           |
|--------|---------------------|-----------------------|
| POST   | `/api/auth/register`| Register user         |
| POST   | `/api/auth/login`   | Login                 |
| GET    | `/api/auth/me`      | Get current user      |
| PUT    | `/api/auth/me`      | Update profile        |

### Products
| Method | Path                         | Description                  |
|--------|------------------------------|------------------------------|
| GET    | `/api/products`              | List (search, category, lowStock filter) |
| POST   | `/api/products`              | Create product               |
| PUT    | `/api/products/:id`          | Update product               |
| DELETE | `/api/products/:id`          | Soft delete                  |
| GET    | `/api/products/meta/categories` | Distinct categories       |

### Receipts
| Method | Path                         | Description                  |
|--------|------------------------------|------------------------------|
| GET    | `/api/receipts`              | List with filters + pagination |
| POST   | `/api/receipts`              | Create receipt               |
| PUT    | `/api/receipts/:id`          | Update receipt               |
| POST   | `/api/receipts/:id/validate` | Validate → stock +           |
| DELETE | `/api/receipts/:id`          | Cancel receipt               |

### Deliveries
| Method | Path                           | Description                  |
|--------|--------------------------------|------------------------------|
| GET    | `/api/deliveries`              | List with filters            |
| POST   | `/api/deliveries`              | Create delivery order        |
| PUT    | `/api/deliveries/:id`          | Update delivery order        |
| POST   | `/api/deliveries/:id/validate` | Validate → stock -           |
| DELETE | `/api/deliveries/:id`          | Cancel delivery              |

### Stock Moves
| Method | Path                  | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/api/moves`          | Full history with filters|
| POST   | `/api/moves/transfer` | Internal transfer        |
| POST   | `/api/moves/adjust`   | Stock adjustment         |

### Warehouses
| Method | Path                            | Description           |
|--------|---------------------------------|-----------------------|
| GET    | `/api/warehouses`               | List warehouses       |
| POST   | `/api/warehouses`               | Create warehouse      |
| PUT    | `/api/warehouses/:id`           | Update warehouse      |
| DELETE | `/api/warehouses/:id`           | Delete warehouse      |
| POST   | `/api/warehouses/:id/locations` | Add location          |

### Dashboard
| Method | Path             | Description                     |
|--------|------------------|---------------------------------|
| GET    | `/api/dashboard` | KPIs, charts, low stock, recent moves |

---

## ✅ Features Implemented

- **Auth** — JWT-based login/register with protected routes
- **Dashboard** — 5 KPI cards, operations-by-status bar chart, low stock alerts, recent moves table
- **Products** — Full CRUD, SKU-based search, category filter, low-stock filter, per-warehouse stock entries
- **Receipts** — Create with multi-line items, editable received quantities, one-click validate (auto-increments stock), cancel
- **Deliveries** — Create with multi-line items, stock availability warning, validate (auto-decrements stock), cancel
- **Move History** — Full audit ledger with type/warehouse/date filters, internal transfer modal, stock adjustment modal
- **Warehouses** — CRUD with expandable location sub-list, add locations inline

---

## 🛠 Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Database  | MongoDB + Mongoose ODM            |
| Backend   | Node.js + Express.js              |
| Auth      | JWT + bcryptjs                    |
| Frontend  | React 18 + React Router v6        |
| Charts    | Recharts                          |
| HTTP      | Axios with interceptors           |
| Toasts    | react-hot-toast                   |
| Fonts     | Syne (display) + DM Sans (body)   |
