# CoreInventory — MERN Stack Inventory Management System

[![MERN Stack](https://img.shields.io/badge/MERN-Stack-blue?style=flat&logo=mongodb&logoColor=white)](https://mern.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-green?style=flat&logo=docker)](https://docker.com)

A full-featured, modular **Inventory Management System** built with **MongoDB, Express, React, and Node.js (MERN Stack)**. Manage products, warehouses, receipts, deliveries, stock movements, and more with a modern UI and robust backend API. Includes user authentication, dashboard analytics, and Docker support for easy deployment.

## ✨ Features

- **User Authentication**: Secure login/register with JWT-based auth middleware.
- **Products Management**: CRUD operations for inventory items.
- **Warehouses**: Manage multiple warehouse locations.
- **Receipts & Deliveries**: Track inbound/outbound stock with detailed pages.
- **Stock Moves**: Full history of inventory movements.
- **Dashboard**: Overview analytics and quick actions.
- **Responsive UI**: Modern React components with context API and custom hooks.
- **Dockerized**: One-command setup with `docker-compose`.
- **Seeding**: Quick DB population with `backend/seed.js`.

## 🛠️ Tech Stack

| Frontend | Backend | Database | DevOps |
|----------|---------|----------|--------|
| React.js | Node.js / Express | MongoDB | Docker, Docker Compose |
| React Context | Mongoose ODM |  | Nginx |
| Custom Hooks | JWT Auth |  |  |
| Tailwind CSS / CSS Modules | bcrypt |  |  |

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Docker (optional, for containerized setup)
- Yarn or npm

### 1. Clone & Install
```bash
git clone <your-repo-url> odoo_hackathon
cd odoo_hackathon

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` in `backend/` and configure:
```
MONGO_URI=mongodb://localhost:27017/coreinventory
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 3. Seed Database (Optional)
```bash
cd backend
npm run seed
```

### 4. Run Locally
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```
App will be available at `http://localhost:3000`.

### 5. Docker (Recommended)
```bash
docker-compose up --build
```
## 🌐 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | User login | ✓ |
| POST | `/api/auth/register` | User register | ✓ |
| GET | `/api/products` | List products | ✓ |
| POST | `/api/products` | Create product | ✓ |
| GET/POST | `/api/receipts`, `/api/deliveries`, `/api/warehouses`, `/api/moves` | CRUD for entities | ✓ |
| GET | `/api/dashboard` | Dashboard data | ✓ |

Full docs: Check `backend/routes/*.js`.

## 📸 Screenshots

*(Add screenshots of Dashboard, Products page, etc.)*

## 🧪 Testing

```bash
# Backend tests (add Jest if needed)
npm test

# Frontend
cd frontend && npm test
```

## 📄 License

MIT License — feel free to use and modify!

---

**Built with ❤️ for efficient inventory management. Contributions welcome!**

