const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const StockMove = require('../models/StockMove');
const { protect } = require('../middleware/auth');

// GET all products
router.get('/', protect, async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;
    let query = { isActive: true };
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { sku: new RegExp(search, 'i') }];
    if (category) query.category = category;
    if (lowStock === 'true') query.$expr = { $lte: ['$totalStock', '$reorderLevel'] };
    const products = await Product.find(query).populate('stockEntries.warehouse', 'name shortCode').sort('-createdAt');
    res.json({ products });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single product
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('stockEntries.warehouse', 'name shortCode');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create product
router.post('/', protect, async (req, res) => {
  try {
    const { name, sku, category, uom, description, unitCost, reorderLevel, initialStock, warehouseId } = req.body;
    const exists = await Product.findOne({ sku: sku.toUpperCase() });
    if (exists) return res.status(400).json({ message: 'SKU already exists' });
    const product = new Product({ name, sku, category, uom, description, unitCost, reorderLevel, createdBy: req.user._id });
    if (initialStock && warehouseId) {
      product.stockEntries.push({ warehouse: warehouseId, quantity: initialStock });
      product.totalStock = initialStock;
    }
    await product.save();
    res.status(201).json({ product });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update product
router.put('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE (soft delete)
router.delete('/:id', protect, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET categories
router.get('/meta/categories', protect, async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json({ categories });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
