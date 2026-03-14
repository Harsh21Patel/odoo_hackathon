const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');
const StockMove = require('../models/StockMove');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      pendingReceipts,
      pendingDeliveries,
      recentMoves,
      receiptStats,
      deliveryStats,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, $expr: { $and: [{ $lte: ['$totalStock', '$reorderLevel'] }, { $gt: ['$totalStock', 0] }] } }),
      Product.countDocuments({ isActive: true, totalStock: 0 }),
      Receipt.countDocuments({ status: { $in: ['Draft', 'Waiting', 'Ready'] } }),
      Delivery.countDocuments({ status: { $in: ['Draft', 'Waiting', 'Ready'] } }),
      StockMove.find({ status: 'Done' }).populate('product', 'name sku').populate('fromWarehouse toWarehouse', 'name').sort('-createdAt').limit(8),
      Receipt.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Delivery.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const lowStockItems = await Product.find({
      isActive: true,
      $expr: { $lte: ['$totalStock', '$reorderLevel'] }
    }).select('name sku totalStock reorderLevel uom').limit(5);

    res.json({
      kpis: { totalProducts, lowStockProducts, outOfStockProducts, pendingReceipts, pendingDeliveries },
      recentMoves,
      lowStockItems,
      receiptStats,
      deliveryStats,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
