const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Warehouse = require('./models/Warehouse');
const Product = require('./models/Product');
const Receipt = require('./models/Receipt');
const Delivery = require('./models/Delivery');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/coreinventory');
  console.log('Connected...');

  await Promise.all([User.deleteMany(), Warehouse.deleteMany(), Product.deleteMany(), Receipt.deleteMany(), Delivery.deleteMany()]);

  const admin = await User.create({ name: 'Admin User', email: 'admin@coreinventory.com', password: 'admin123', role: 'admin' });

  const wh1 = await Warehouse.create({
    name: 'Main Warehouse', shortCode: 'MAIN', address: '123 Industrial Area, Ahmedabad',
    locations: [{ name: 'Rack A', shortCode: 'RACK-A', locationType: 'rack' }, { name: 'Shelf B', shortCode: 'SHELF-B', locationType: 'shelf' }],
    createdBy: admin._id
  });
  const wh2 = await Warehouse.create({
    name: 'Production Floor', shortCode: 'PROD', address: '456 Factory Road, Ahmedabad',
    locations: [{ name: 'Production Zone', shortCode: 'PZ-1', locationType: 'zone' }],
    createdBy: admin._id
  });

  const products = await Product.insertMany([
    { name: 'Steel Rods', sku: 'STL-ROD-001', category: 'Raw Material', uom: 'kg', reorderLevel: 50, unitCost: 80,
      stockEntries: [{ warehouse: wh1._id, location: 'Rack A', quantity: 350 }], totalStock: 350, createdBy: admin._id },
    { name: 'Aluminium Sheets', sku: 'ALU-SHT-002', category: 'Raw Material', uom: 'kg', reorderLevel: 30, unitCost: 220,
      stockEntries: [{ warehouse: wh1._id, location: 'Rack A', quantity: 120 }], totalStock: 120, createdBy: admin._id },
    { name: 'Hydraulic Pump', sku: 'HYD-PMP-003', category: 'Machinery', uom: 'pcs', reorderLevel: 5, unitCost: 4500,
      stockEntries: [{ warehouse: wh1._id, location: 'Shelf B', quantity: 8 }], totalStock: 8, createdBy: admin._id },
    { name: 'Safety Helmets', sku: 'SAF-HLM-004', category: 'Safety Equipment', uom: 'pcs', reorderLevel: 20, unitCost: 350,
      stockEntries: [{ warehouse: wh1._id, location: 'Shelf B', quantity: 15 }], totalStock: 15, createdBy: admin._id },
    { name: 'Welding Wire', sku: 'WLD-WRE-005', category: 'Consumables', uom: 'kg', reorderLevel: 25, unitCost: 180,
      stockEntries: [{ warehouse: wh2._id, location: 'Production Zone', quantity: 5 }], totalStock: 5, createdBy: admin._id },
    { name: 'Bearing 6205', sku: 'BRG-6205-006', category: 'Spares', uom: 'pcs', reorderLevel: 10, unitCost: 120,
      stockEntries: [{ warehouse: wh1._id, location: 'Rack A', quantity: 0 }], totalStock: 0, createdBy: admin._id },
  ]);

  await Receipt.create({
    supplier: 'Tata Steel Ltd.', warehouse: wh1._id, location: 'Rack A',
    scheduledDate: new Date(), status: 'Ready',
    lines: [{ product: products[0]._id, expectedQty: 200, receivedQty: 0, uom: 'kg' }],
    createdBy: admin._id,
  });
  await Receipt.create({
    supplier: 'National Aluminium Co.', warehouse: wh1._id, location: 'Rack A',
    scheduledDate: new Date(Date.now() + 86400000), status: 'Waiting',
    lines: [{ product: products[1]._id, expectedQty: 100, receivedQty: 0, uom: 'kg' }],
    createdBy: admin._id,
  });

  await Delivery.create({
    customer: 'Adani Industries', warehouse: wh1._id, location: 'Rack A',
    scheduledDate: new Date(), status: 'Ready',
    lines: [{ product: products[0]._id, demandQty: 50, doneQty: 0, uom: 'kg' }],
    createdBy: admin._id,
  });

  console.log('✅ Seed complete!');
  console.log('Login: admin@coreinventory.com / admin123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
