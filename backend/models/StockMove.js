const mongoose = require('mongoose');

const stockMoveSchema = new mongoose.Schema({
  reference: { type: String },
  moveType: { type: String, enum: ['receipt', 'delivery', 'transfer', 'adjustment'], required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  fromWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  fromLocation: String,
  toWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  toLocation: String,
  quantity: { type: Number, required: true },
  uom: String,
  status: { type: String, enum: ['Draft', 'Done', 'Cancelled'], default: 'Draft' },
  vendor: String,
  customer: String,
  sourceDoc: String,
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('StockMove', stockMoveSchema);