const mongoose = require('mongoose');

const receiptLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  expectedQty: { type: Number, required: true, min: 0 },
  receivedQty: { type: Number, default: 0 },
  uom: String,
});

const receiptSchema = new mongoose.Schema({
  reference: { type: String, unique: true },
  supplier: { type: String, required: true },
  contact: { type: String },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  location: String,
  scheduledDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Draft', 'Waiting', 'Ready', 'Done', 'Cancelled'], default: 'Draft' },
  lines: [receiptLineSchema],
  notes: String,
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validatedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

receiptSchema.pre('save', async function(next) {
  if (!this.reference) {
    const Warehouse = mongoose.model('Warehouse');
    const wh = await Warehouse.findById(this.warehouse);
    const whCode = wh ? wh.shortCode : 'WH';
    const count = await mongoose.model('Receipt').countDocuments();
    this.reference = `${whCode}/IN/${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Receipt', receiptSchema);