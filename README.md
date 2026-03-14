<div align="center">

<img src="https://img.shields.io/badge/CoreInventory-IMS-1a1a1a?style=for-the-badge&logoColor=white" alt="CoreInventory" />

# CoreInventory
### Inventory Management System

> **Odoo x Indus University Hackathon '26** — Digitizing warehouse operations from the ground up.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## 📌 The Problem

Businesses today still manage stock with Excel sheets, paper registers, and scattered WhatsApp messages. There's no single source of truth — products go untracked, receipts are lost, and stock discrepancies are discovered too late.

**CoreInventory** replaces all of that with a centralized, real-time, role-aware inventory management system built for the way warehouses actually work.

---

## 🖼️ Preview

![CoreInventory Dashboard](https://ik.imagekit.io/ijus5prtnb/Screenshot%202026-03-14%20at%204.49.24%E2%80%AFPM.png)

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based login & registration
- OTP-based forgot password flow (6-digit, 10-minute expiry)
- Strong password enforcement (uppercase, lowercase, special character, min 8 chars)
- Role-based access control — **Admin**, **Manager**, **Staff**

### 📊 Dashboard
- Live KPIs — Total Products, Low Stock, Out of Stock, Pending Receipts, Pending Deliveries
- Operations by Status chart (Recharts)
- Low Stock alerts with reorder level indicators
- Recent stock movements feed

### 📦 Product Management
- Create products with SKU, Category, Unit of Measure, Unit Cost, Reorder Level
- Per-warehouse stock entries
- Low stock / out of stock status badges
- Category filter, SKU search, smart low-stock filter

### 🚚 Receipts (Incoming Stock)
- Create receipts with supplier, warehouse, scheduled date, and product lines
- Pipeline: `Draft → Ready to Receive → Received`
- Validate to automatically increase stock
- Print receipt as PDF

### 📤 Deliveries (Outgoing Stock)
- Create delivery orders with customer, delivery address, product lines
- Pipeline: `Draft → Waiting → Ready → Delivered`
- Insufficient stock warning before validation
- Validate to automatically decrease stock
- Print delivery order

### 🔄 Internal Transfers
- Move stock between warehouses or locations
- Total stock unchanged — only location updated
- Full audit trail in Move History

### ⚖️ Stock Adjustments
- Fix mismatches between recorded and physical stock
- Enter actual counted quantity — system calculates the difference
- Every adjustment logged with notes

### 📋 Move History
- Complete ledger of all stock movements
- Filter by type (receipt / delivery / transfer / adjustment), warehouse, date range
- Shows from/to warehouse, product, quantity, and responsible user

### 🏭 Warehouses
- Multi-warehouse support
- Locations within warehouses (Rack, Shelf, Floor, Zone)
- Short codes for quick identification

### 👥 Role-Based Access Control

| Action | Admin | Staff |
|--------|:-----:|:-----:|
| View everything | ✅ | ✅ |
| Create receipts & deliveries | ✅ | ✅ |
| Edit receipts & deliveries | ✅ | ✅ |
| **Validate** (approve) receipts & deliveries | ✅ | ❌ |
| **Cancel** receipts & deliveries | ✅ | ❌ |
| Create / edit products | ✅ | ❌ |
| Delete products | ✅ | ❌ |
| Manage warehouses | ✅ | ❌ |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js 18, React Router v6, Recharts |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose ODM |
| **Auth** | JSON Web Tokens (JWT), bcryptjs |
| **HTTP Client** | Axios |
| **Notifications** | react-hot-toast |
| **Styling** | Custom CSS with CSS Variables |

---

## 🗂️ Project Structure

```
coreinventory/
├── backend/
│   ├── middleware/
│   │   └── auth.js           # protect + authorize (RBAC)
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Receipt.js
│   │   ├── Delivery.js
│   │   ├── StockMove.js
│   │   └── Warehouse.js
│   ├── routes/
│   │   ├── auth.js           # login, register, OTP forgot password
│   │   ├── products.js
│   │   ├── receipts.js
│   │   ├── deliveries.js
│   │   ├── moves.js          # transfers + adjustments
│   │   ├── warehouses.js
│   │   └── dashboard.js
│   ├── seed.js
│   └── server.js
│
└── frontend/
    ├── public/                         # static assets & index.html
    ├── src/
    │   ├── components/
    │   │   └── layout/
    │   │       ├── Layout.js           # app shell — sidebar + outlet
    │   │       └── Layout.css          # sidebar styles & CSS variables
    │   │
    │   ├── context/
    │   │   └── AuthContext.js          # global auth state (login/logout/user)
    │   │
    │   ├── hooks/
    │   │   └── useModalOpen.js         # locks body scroll when modal is open
    │   │
    │   ├── pages/
    │   │   ├── LoginPage.js            # sign in
    │   │   ├── RegisterPage.js         # sign up with password strength meter
    │   │   ├── ForgotPasswordPage.js   # OTP-based password reset (3 steps)
    │   │   ├── AuthPage.css            # shared auth page styles
    │   │   │
    │   │   ├── DashboardPage.js        # KPIs, charts, low stock alerts
    │   │   ├── ProductsPage.js         # product list, create/edit/delete
    │   │   │
    │   │   ├── ReceiptsPage.js         # incoming stock list
    │   │   ├── ReceiptDetailPage.js    # receipt pipeline + validate
    │   │   │
    │   │   ├── DeliveriesPage.js       # outgoing stock list
    │   │   ├── DeliveryDetailPage.js   # delivery pipeline + validate
    │   │   │
    │   │   ├── MoveHistoryPage.js      # full stock ledger + transfer/adjust
    │   │   └── WarehousesPage.js       # warehouse & location management
    │   │
    │   ├── utils/
    │   │   ├── api.js                  # axios instance + 401 interceptor
    │   │   └── helpers.js              # formatDate, statusColor, moveTypeIcon
    │   │
    │   ├── App.js                      # routes + auth guards
    │   ├── index.css                   # global styles, CSS variables
    │   └── index.js                    # React entry point
    │
    ├── Dockerfile                      # nginx-based production build
    ├── nginx.conf                      # SPA routing config
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/) (local) or a [MongoDB Atlas](https://www.mongodb.com/atlas) URI
- npm or yarn

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/coreinventory.git
cd coreinventory
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/coreinventory
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

Seed the database with demo data:

```bash
npm run seed
```

This creates:
- 2 warehouses (Main Warehouse, Production Floor)
- 6 products across categories
- Sample receipts and deliveries
- Admin user: `admin@coreinventory.com` / `admin123`

Start the backend server:

```bash
npm run dev
```

> Server runs on `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm start
```

> App runs on `http://localhost:3000`

---

### 4. Login

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@coreinventory.com` | `admin123` |

To create Manager or Staff users, register via the app (default role: Staff) or update the role directly in MongoDB.

---

## 📸 Screenshots

> Dashboard, Receipts, Delivery Detail, Move History

<!-- Add screenshots here -->
| Dashboard | Receipt Detail | Products |
|-----------|---------------|---------|
| ![Dashboard](./screenshots/dashboard.png) | ![Receipt](./screenshots/receipt.png) | ![Products](./screenshots/products.png) |

---

## 🔄 Inventory Flow

```
Vendor
  │
  ▼
Receipt (Incoming) ──► Validate ──► Stock +qty
                                        │
                                        ├──► Internal Transfer ──► New Location
                                        │
                                        ├──► Stock Adjustment ──► Fix Discrepancy
                                        │
                                        ▼
                                   Delivery (Outgoing) ──► Validate ──► Stock -qty
                                                                            │
                                                                            ▼
                                                                        Customer
```

Every movement is logged in the **Stock Ledger (Move History)** with full traceability.

---

## 🔐 API Endpoints

### Auth
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login
GET    /api/auth/me                Get current user
POST   /api/auth/forgot-password   Send OTP
POST   /api/auth/verify-otp        Verify OTP → get reset token
POST   /api/auth/reset-password    Set new password
```

### Products
```
GET    /api/products               List all products
POST   /api/products               Create product          [Admin]
PUT    /api/products/:id           Update product          [Admin]
DELETE /api/products/:id           Delete product          [Admin]
```

### Receipts
```
GET    /api/receipts               List receipts
POST   /api/receipts               Create receipt
PUT    /api/receipts/:id           Update receipt
POST   /api/receipts/:id/validate  Validate → stock +qty   [Admin]
DELETE /api/receipts/:id           Cancel receipt          [Admin]
```

### Deliveries
```
GET    /api/deliveries             List deliveries
POST   /api/deliveries             Create delivery
PUT    /api/deliveries/:id         Update delivery
POST   /api/deliveries/:id/validate Validate → stock -qty  [Admin]
DELETE /api/deliveries/:id         Cancel delivery         [Admin]
```

### Moves
```
GET    /api/moves                  Move history
POST   /api/moves/transfer         Internal transfer
POST   /api/moves/adjust           Stock adjustment
```

### Warehouses
```
GET    /api/warehouses             List warehouses
POST   /api/warehouses             Create warehouse        [Admin]
PUT    /api/warehouses/:id         Update warehouse        [Admin]
DELETE /api/warehouses/:id         Delete warehouse        [Admin]
POST   /api/warehouses/:id/locations  Add location        [Admin]
```

---

## 👥 Team

Built with ❤️ for **Odoo x Indus University Hackathon '26** by:

| Name | GitHub | LinkedIn |
|------|--------|----------|
| **Harsh Patel** | [![GitHub](https://img.shields.io/badge/Harsh21Patel-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/Harsh21Patel) | [![LinkedIn](https://img.shields.io/badge/harshpatel21-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/harshpatel21/) |
| **Mohit Keswani** | [![GitHub](https://img.shields.io/badge/m--keswani-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/m-keswani) | [![LinkedIn](https://img.shields.io/badge/mohit025-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/mohit025/) |
| **Diya Solanki** | [![GitHub](https://img.shields.io/badge/Diyasolanki-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/Diyasolanki) | [![LinkedIn](https://img.shields.io/badge/diya--solanki-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/diya-solanki-744122280/) |
| **Rency Tarapara** | [![GitHub](https://img.shields.io/badge/rencyTarapara-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/rencyTarapara) | [![LinkedIn](https://img.shields.io/badge/renshi--tarapara-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/renshi-tarapara-2b5ba6303/) |
 
---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**CoreInventory** — Built for the Odoo x Indus University Hackathon '26 🏆

*Replacing spreadsheets, one warehouse at a time.*

</div>
