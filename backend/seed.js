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

  /* ---------------- ADMIN ---------------- */

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@coreinventory.com',
    password: 'admin123',
    role: 'admin'
  });

  /* ---------------- WAREHOUSES ---------------- */

  const wh1 = await Warehouse.create({
    name: 'Main Warehouse',
    shortCode: 'MAIN',
    address: '123 Industrial Area, Ahmedabad',
    locations: [
      { name: 'Rack A', shortCode: 'RACK-A', locationType: 'rack' },
      { name: 'Rack B', shortCode: 'RACK-B', locationType: 'rack' },
      { name: 'Shelf A', shortCode: 'SHELF-A', locationType: 'shelf' },
      { name: 'Shelf B', shortCode: 'SHELF-B', locationType: 'shelf' }
    ],
    createdBy: admin._id
  });

  const wh2 = await Warehouse.create({
    name: 'Electronics Storage',
    shortCode: 'ELEC',
    address: '456 Tech Park Road, Ahmedabad',
    locations: [
      { name: 'Device Rack 1', shortCode: 'DR-1', locationType: 'rack' },
      { name: 'Device Rack 2', shortCode: 'DR-2', locationType: 'rack' },
      { name: 'Accessory Shelf', shortCode: 'AS-1', locationType: 'shelf' }
    ],
    createdBy: admin._id
  });

  /* ---------------- PRODUCTS ---------------- */

  const productData = [];

  const productNames = [
    "LED Monitor","Wireless Keyboard","Optical Mouse","WiFi Router",
    "Bluetooth Speaker","External HDD","HDMI Cable","USB-C Charger",
    "Laptop Stand","Extension Board","Gaming Headset","Webcam",
    "USB Flash Drive","Power Bank","Smart Plug","SSD Drive",
    "Ethernet Cable","Laptop Cooling Pad","Wireless Adapter","Mini Projector"
  ];

  for (let i = 0; i < 20; i++) {

    let qty = Math.floor(Math.random()*60);

    if(i === 2 || i === 5) qty = 0; // out of stock
    if(i === 7 || i === 12) qty = 3; // low stock

    productData.push({
      name: productNames[i],
      sku: `ELE-${100+i}`,
      category: "Electronics",
      uom: "pcs",
      reorderLevel: 5,
      unitCost: Math.floor(Math.random()*5000)+500,
      stockEntries: [{
        warehouse: wh1._id,
        location: "Rack A",
        quantity: qty
      }],
      totalStock: qty,
      createdBy: admin._id
    });

  }

  const products = await Product.insertMany(productData);

  /* ---------------- RECEIPTS ---------------- */

  const receipts = [];

  for(let i=0;i<15;i++){

    const product = products[Math.floor(Math.random()*products.length)];

    receipts.push({
      supplier:`Supplier ${i+1}`,
      warehouse:wh1._id,
      location:"Rack B",
      scheduledDate:new Date(),
      status:["Draft","Waiting","Ready","Done"][Math.floor(Math.random()*4)],
      lines:[
        {
          product:product._id,
          expectedQty:Math.floor(Math.random()*40)+5,
          receivedQty:0,
          uom:"pcs"
        }
      ],
      createdBy:admin._id
    });

  }

  await Receipt.insertMany(receipts);

  /* ---------------- DELIVERIES ---------------- */

  const deliveries=[];

  for(let i=0;i<15;i++){

    const product = products[Math.floor(Math.random()*products.length)];

    deliveries.push({
      customer:`Customer ${i+1}`,
      warehouse:wh1._id,
      location:"Shelf A",
      scheduledDate:new Date(),
      status:["Draft","Waiting","Ready","Done"][Math.floor(Math.random()*4)],
      lines:[
        {
          product:product._id,
          demandQty:Math.floor(Math.random()*15)+1,
          doneQty:0,
          uom:"pcs"
        }
      ],
      createdBy:admin._id
    });

  }

  await Delivery.insertMany(deliveries);

  console.log("Products:",products.length);
  console.log("Receipts:",receipts.length);
  console.log("Deliveries:",deliveries.length);

  console.log('✅ Seed completed!');
  console.log('Login: admin@coreinventory.com / admin123');

  process.exit(0);

}

seed().catch(err=>{
  console.error(err);
  process.exit(1);
});