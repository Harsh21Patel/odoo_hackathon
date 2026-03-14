const express = require('express');
const router = express.Router();
const Receipt = require('../models/Receipt');
const Product = require('../models/Product');
const StockMove = require('../models/StockMove');
const { protect, authorize } = require('../middleware/auth');

// All roles: view receipts
router.get('/', protect, async (req, res) => {
  try {
    const { status, warehouse, search, page = 1, limit = 20 } = req.query;
    let query = {};
    if (status) query.status = status;
    if (warehouse) query.warehouse = warehouse;
    if (search) query.$or = [{ reference: new RegExp(search, 'i') }, { supplier: new RegExp(search, 'i') }];
    const total = await Receipt.countDocuments(query);
    const receipts = await Receipt.find(query)
      .populate('warehouse', 'name shortCode')
      .populate('lines.product', 'name sku uom')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ receipts, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// All roles: view single receipt
router.get('/:id', protect, async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('warehouse', 'name shortCode locations')
      .populate('lines.product', 'name sku uom totalStock')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name');
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });
    res.json({ receipt });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// All roles: create receipt
router.post('/', protect, async (req, res) => {
  try {
    const { supplier, contact, warehouse, location, scheduledDate, lines, notes } = req.body;
    const receipt = await Receipt.create({ supplier, contact, warehouse, location, scheduledDate, lines, notes, createdBy: req.user._id, status: 'Draft' });
    res.status(201).json({ receipt });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// All roles: edit receipt (only if not Done)
router.put('/:id', protect, async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });
    if (receipt.status === 'Done') return res.status(400).json({ message: 'Cannot edit a validated receipt' });
    Object.assign(receipt, req.body);
    await receipt.save();
    res.json({ receipt });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin only: validate receipt → increase stock
router.post('/:id/validate', protect, authorize('admin'), async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id).populate('lines.product');
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });
    if (receipt.status === 'Done') return res.status(400).json({ message: 'Already validated' });

    for (const line of receipt.lines) {
      const product = await Product.findById(line.product._id || line.product);
      if (!product) continue;
      const qty = line.receivedQty || line.expectedQty;
      const existingEntry = product.stockEntries.find(e => String(e.warehouse) === String(receipt.warehouse));
      if (existingEntry) {
        existingEntry.quantity += qty;
      } else {
        product.stockEntries.push({ warehouse: receipt.warehouse, location: receipt.location, quantity: qty });
      }
      product.totalStock = product.stockEntries.reduce((s, e) => s + e.quantity, 0);
      await product.save();

      await StockMove.create({
        reference: receipt.reference,
        moveType: 'receipt',
        product: product._id,
        toWarehouse: receipt.warehouse,
        toLocation: receipt.location,
        quantity: qty,
        uom: line.uom,
        status: 'Done',
        sourceDoc: receipt.reference,
        vendor: receipt.supplier,
        createdBy: req.user._id,
      });
    }

    receipt.status = 'Done';
    receipt.validatedBy = req.user._id;
    receipt.validatedAt = new Date();
    await receipt.save();
    res.json({ receipt, message: 'Receipt validated. Stock updated.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin only: cancel receipt
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });
    if (receipt.status === 'Done') return res.status(400).json({ message: 'Cannot delete a validated receipt' });
    receipt.status = 'Cancelled';
    await receipt.save();
    res.json({ message: 'Receipt cancelled' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;