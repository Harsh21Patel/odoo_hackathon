const mongoose = require('mongoose');

const stockEntrySchema = new mongoose.Schema({
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  location: String,
  quantity: { type: Number, default: 0 },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true },
  category: { type: String, required: true },
  uom: { type: String, default: 'pcs', enum: ['pcs', 'kg', 'ltr', 'mtr', 'box', 'set', 'pkt'] },
  description: String,
  unitCost: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 10 },
  stockEntries: [stockEntrySchema],
  totalStock: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

productSchema.methods.calculateTotal = function() {
  this.totalStock = this.stockEntries.reduce((sum, e) => sum + e.quantity, 0);
};

module.exports = mongoose.model('Product', productSchema);
