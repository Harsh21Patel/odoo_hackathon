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

  await Promise.all([
    User.deleteMany(),
    Warehouse.deleteMany(),
    Product.deleteMany(),
    Receipt.deleteMany(),
    Delivery.deleteMany()
  ]);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@coreinventory.com',
    password: 'admin123',
    role: 'admin'
  });

  const wh1 = await Warehouse.create({
    name: 'Main Warehouse',
    shortCode: 'MAIN',
    address: '123 Industrial Area, Ahmedabad',
    locations: [
      { name: 'Rack A', shortCode: 'RACK-A', locationType: 'rack' },
      { name: 'Shelf B', shortCode: 'SHELF-B', locationType: 'shelf' }
    ],
    createdBy: admin._id
  });

  const wh2 = await Warehouse.create({
    name: 'Electronics Storage',
    shortCode: 'ELEC',
    address: '456 Tech Park Road, Ahmedabad',
    locations: [
      { name: 'Device Zone', shortCode: 'DEV-Z', locationType: 'zone' }
    ],
    createdBy: admin._id
  });

  const products = await Product.insertMany([
    {
      name: 'LED Monitor 24"',
      sku: 'ELE-MON-001',
      category: 'Electronics',
      uom: 'pcs',
      reorderLevel: 5,
      unitCost: 8500,
      stockEntries: [{ warehouse: wh1._id, location: 'Rack A', quantity: 20 }],
      totalStock: 20,
      createdBy: admin._id
    },
    {
      name: 'Wireless Keyboard',
      sku: 'ELE-KEY-002',
      category: 'Electronics',
      uom: 'pcs',
      reorderLevel: 10,
      unitCost: 1200,
      stockEntries: [{ warehouse: wh1._id, location: 'Rack A', quantity: 40 }],
      totalStock: 40,
      createdBy: admin._id
    },
    {
      name: 'Optical Mouse',
      sku: 'ELE-MOU-003',
      category: 'Electronics',
      uom: 'pcs',
      reorderLevel: 20,
      unitCost: 400,
      stockEntries: [{ warehouse: wh1._id, location: 'Rack A', quantity: 80 }],
      totalStock: 80,
      createdBy: admin._id
    },
    {
      name: 'WiFi Router',
      sku: 'ELE-ROU-004',
      category: 'Networking',
      uom: 'pcs',
      reorderLevel: 5,
      unitCost: 2800,
      stockEntries: [{ warehouse: wh1._id, location: 'Shelf B', quantity: 18 }],
      totalStock: 18,
      createdBy: admin._id
    },
    {
      name: 'Bluetooth Speaker',
      sku: 'ELE-SPK-005',
      category: 'Audio',
      uom: 'pcs',
      reorderLevel: 7,
      unitCost: 2200,
      stockEntries: [{ warehouse: wh2._id, location: 'Device Zone', quantity: 22 }],
      totalStock: 22,
      createdBy: admin._id
    },
    {
      name: 'External Hard Drive 1TB',
      sku: 'ELE-HDD-006',
      category: 'Storage',
      uom: 'pcs',
      reorderLevel: 6,
      unitCost: 5200,
      stockEntries: [{ warehouse: wh1._id, location: 'Shelf B', quantity: 12 }],
      totalStock: 12,
      createdBy: admin._id
    },
    {
      name: 'HDMI Cable 2m',
      sku: 'ELE-HDMI-007',
      category: 'Accessories',
      uom: 'pcs',
      reorderLevel: 25,
      unitCost: 350,
      stockEntries: [{ warehouse: wh1._id, location: 'Rack A', quantity: 100 }],
      totalStock: 100,
      createdBy: admin._id
    },
    {
      name: 'USB-C Charger 65W',
      sku: 'ELE-CHR-008',
      category: 'Accessories',
      uom: 'pcs',
      reorderLevel: 10,
      unitCost: 1500,
      stockEntries: [{ warehouse: wh2._id, location: 'Device Zone', quantity: 35 }],
      totalStock: 35,
      createdBy: admin._id
    },
    {
      name: 'Laptop Stand',
      sku: 'ELE-STD-009',
      category: 'Accessories',
      uom: 'pcs',
      reorderLevel: 8,
      unitCost: 900,
      stockEntries: [{ warehouse: wh1._id, location: 'Shelf B', quantity: 25 }],
      totalStock: 25,
      createdBy: admin._id
    },
    {
      name: 'Power Extension Board',
      sku: 'ELE-EXT-010',
      category: 'Accessories',
      uom: 'pcs',
      reorderLevel: 15,
      unitCost: 650,
      stockEntries: [{ warehouse: wh1._id, location: 'Rack A', quantity: 50 }],
      totalStock: 50,
      createdBy: admin._id
    }
  ]);

  await Receipt.create({
    supplier: 'Dell Electronics',
    warehouse: wh1._id,
    location: 'Rack A',
    scheduledDate: new Date(),
    status: 'Ready',
    lines: [
      { product: products[0]._id, expectedQty: 10, receivedQty: 0, uom: 'pcs' }
    ],
    createdBy: admin._id
  });

  await Receipt.create({
    supplier: 'Logitech India',
    warehouse: wh1._id,
    location: 'Rack A',
    scheduledDate: new Date(Date.now() + 86400000),
    status: 'Waiting',
    lines: [
      { product: products[1]._id, expectedQty: 30, receivedQty: 0, uom: 'pcs' }
    ],
    createdBy: admin._id
  });

  await Delivery.create({
    customer: 'Tech Solutions Pvt Ltd',
    warehouse: wh1._id,
    location: 'Rack A',
    scheduledDate: new Date(),
    status: 'Ready',
    lines: [
      { product: products[2]._id, demandQty: 15, doneQty: 0, uom: 'pcs' }
    ],
    createdBy: admin._id
  });

  console.log('✅ Seed complete!');
  console.log('Login: admin@coreinventory.com / admin123');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});