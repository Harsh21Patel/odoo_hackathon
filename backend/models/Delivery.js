const mongoose = require('mongoose');

const deliveryLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  demandQty: { type: Number, required: true, min: 0 },
  doneQty: { type: Number, default: 0 },
  uom: String,
});

const deliverySchema = new mongoose.Schema({
  reference: { type: String, unique: true },
  customer: { type: String, required: true },
  contact: { type: String },
  deliveryAddress: { type: String },
  operationType: { type: String, default: 'Outgoing' },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  location: String,
  scheduledDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Draft', 'Waiting', 'Ready', 'Done', 'Cancelled'], default: 'Draft' },
  lines: [deliveryLineSchema],
  notes: String,
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validatedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

deliverySchema.pre('save', async function(next) {
  if (!this.reference) {
    const Warehouse = mongoose.model('Warehouse');
    const wh = await Warehouse.findById(this.warehouse);
    const whCode = wh ? wh.shortCode : 'WH';
    const count = await mongoose.model('Delivery').countDocuments();
    this.reference = `${whCode}/OUT/${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Delivery', deliverySchema);