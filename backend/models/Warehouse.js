const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortCode: { type: String, required: true },
  locationType: { type: String, enum: ['rack', 'shelf', 'floor', 'zone', 'other'], default: 'zone' },
});

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  shortCode: { type: String, required: true, unique: true, uppercase: true },
  address: { type: String },
  locations: [locationSchema],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Warehouse', warehouseSchema);
