const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Product = require('../models/Product');
const StockMove = require('../models/StockMove');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { status, warehouse, search, page = 1, limit = 20 } = req.query;
    let query = {};
    if (status) query.status = status;
    if (warehouse) query.warehouse = warehouse;
    if (search) query.$or = [{ reference: new RegExp(search, 'i') }, { customer: new RegExp(search, 'i') }, { contact: new RegExp(search, 'i') }];
    const total = await Delivery.countDocuments(query);
    const deliveries = await Delivery.find(query)
      .populate('warehouse', 'name shortCode')
      .populate('lines.product', 'name sku uom totalStock')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ deliveries, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('warehouse', 'name shortCode locations')
      .populate('lines.product', 'name sku uom totalStock')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name');
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    res.json({ delivery });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { customer, contact, deliveryAddress, operationType, warehouse, location, scheduledDate, lines, notes } = req.body;
    const delivery = await Delivery.create({
      customer, contact, deliveryAddress, operationType,
      warehouse, location, scheduledDate, lines, notes,
      createdBy: req.user._id, status: 'Draft'
    });
    res.status(201).json({ delivery });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    if (delivery.status === 'Done') return res.status(400).json({ message: 'Cannot edit a validated delivery' });
    Object.assign(delivery, req.body);
    await delivery.save();
    res.json({ delivery });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Validate delivery → decrease stock
router.post('/:id/validate', protect, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id).populate('lines.product');
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    if (delivery.status === 'Done') return res.status(400).json({ message: 'Already validated' });

    for (const line of delivery.lines) {
      const product = await Product.findById(line.product._id || line.product);
      if (!product) continue;
      const qty = line.doneQty || line.demandQty;
      const existingEntry = product.stockEntries.find(e => String(e.warehouse) === String(delivery.warehouse));
      if (existingEntry) {
        existingEntry.quantity = Math.max(0, existingEntry.quantity - qty);
      }
      product.totalStock = product.stockEntries.reduce((s, e) => s + e.quantity, 0);
      await product.save();

      await StockMove.create({
        reference: delivery.reference,
        moveType: 'delivery',
        product: product._id,
        fromWarehouse: delivery.warehouse,
        fromLocation: delivery.location,
        quantity: qty,
        uom: line.uom,
        status: 'Done',
        sourceDoc: delivery.reference,
        customer: delivery.customer,
        createdBy: req.user._id,
      });
    }

    delivery.status = 'Done';
    delivery.validatedBy = req.user._id;
    delivery.validatedAt = new Date();
    await delivery.save();
    res.json({ delivery, message: 'Delivery validated. Stock updated.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    if (delivery.status === 'Done') return res.status(400).json({ message: 'Cannot cancel a validated delivery' });
    delivery.status = 'Cancelled';
    await delivery.save();
    res.json({ message: 'Delivery cancelled' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;