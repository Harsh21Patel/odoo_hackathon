const express = require('express');
const router = express.Router();
const Warehouse = require('../models/Warehouse');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true }).sort('name');
    res.json({ warehouses });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });
    res.json({ warehouse });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { name, shortCode, address, locations } = req.body;
    const exists = await Warehouse.findOne({ shortCode: shortCode.toUpperCase() });
    if (exists) return res.status(400).json({ message: 'Short code already exists' });
    const warehouse = await Warehouse.create({ name, shortCode, address, locations, createdBy: req.user._id });
    res.status(201).json({ warehouse });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });
    res.json({ warehouse });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Warehouse.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Warehouse deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add location to warehouse
router.post('/:id/locations', protect, async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });
    warehouse.locations.push(req.body);
    await warehouse.save();
    res.json({ warehouse });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
