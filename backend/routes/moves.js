const express = require('express');
const router = express.Router();
const StockMove = require('../models/StockMove');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { moveType, product, warehouse, status, from, to, page = 1, limit = 30 } = req.query;
    let query = {};
    if (moveType) query.moveType = moveType;
    if (product) query.product = product;
    if (status) query.status = status;
    if (warehouse) query.$or = [{ fromWarehouse: warehouse }, { toWarehouse: warehouse }];
    if (from) query.createdAt = { ...query.createdAt, $gte: new Date(from) };
    if (to) query.createdAt = { ...query.createdAt, $lte: new Date(to) };

    const total = await StockMove.countDocuments(query);
    const moves = await StockMove.find(query)
      .populate('product', 'name sku uom')
      .populate('fromWarehouse', 'name shortCode')
      .populate('toWarehouse', 'name shortCode')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ moves, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Internal transfer
router.post('/transfer', protect, async (req, res) => {
  try {
    const { productId, fromWarehouseId, fromLocation, toWarehouseId, toLocation, quantity, notes } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const fromEntry = product.stockEntries.find(e => String(e.warehouse) === String(fromWarehouseId));
    if (!fromEntry || fromEntry.quantity < quantity) return res.status(400).json({ message: 'Insufficient stock in source location' });

    fromEntry.quantity -= quantity;
    const toEntry = product.stockEntries.find(e => String(e.warehouse) === String(toWarehouseId));
    if (toEntry) {
      toEntry.quantity += quantity;
    } else {
      product.stockEntries.push({ warehouse: toWarehouseId, location: toLocation, quantity });
    }
    product.totalStock = product.stockEntries.reduce((s, e) => s + e.quantity, 0);
    await product.save();

    const count = await StockMove.countDocuments({ moveType: 'transfer' });
    const move = await StockMove.create({
      reference: `TRF/${String(count + 1).padStart(5, '0')}`,
      moveType: 'transfer',
      product: productId,
      fromWarehouse: fromWarehouseId,
      fromLocation,
      toWarehouse: toWarehouseId,
      toLocation,
      quantity,
      status: 'Done',
      notes,
      createdBy: req.user._id,
    });
    res.status(201).json({ move, message: 'Internal transfer completed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Stock adjustment
router.post('/adjust', protect, async (req, res) => {
  try {
    const { productId, warehouseId, location, countedQty, notes } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const entry = product.stockEntries.find(e => String(e.warehouse) === String(warehouseId));
    const currentQty = entry ? entry.quantity : 0;
    const diff = countedQty - currentQty;

    if (entry) {
      entry.quantity = countedQty;
    } else {
      product.stockEntries.push({ warehouse: warehouseId, location, quantity: countedQty });
    }
    product.totalStock = product.stockEntries.reduce((s, e) => s + e.quantity, 0);
    await product.save();

    const count = await StockMove.countDocuments({ moveType: 'adjustment' });
    const move = await StockMove.create({
      reference: `ADJ/${String(count + 1).padStart(5, '0')}`,
      moveType: 'adjustment',
      product: productId,
      toWarehouse: warehouseId,
      toLocation: location,
      quantity: Math.abs(diff),
      status: 'Done',
      notes: notes || `Adjustment: ${currentQty} → ${countedQty}`,
      createdBy: req.user._id,
    });
    res.status(201).json({ move, diff, message: `Stock adjusted by ${diff > 0 ? '+' : ''}${diff}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
