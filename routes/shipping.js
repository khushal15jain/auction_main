const express = require('express');
const router = express.Router();

const SHIPPING_OPTIONS = [
  { name: 'Standard', basePrice: 5.99, perKg: 1.50, estimatedDays: '5-7 business days' },
  { name: 'Express', basePrice: 12.99, perKg: 2.50, estimatedDays: '2-3 business days' },
  { name: 'Overnight', basePrice: 24.99, perKg: 4.00, estimatedDays: '1 business day' },
  { name: 'Economy', basePrice: 3.49, perKg: 0.75, estimatedDays: '7-14 business days' }
];

// Get available shipping options
router.get('/options', (req, res) => {
  res.json(SHIPPING_OPTIONS);
});

// Calculate shipping cost
router.post('/calculate', (req, res) => {
  try {
    const { weight = 1, method = 'Standard', distance = 100 } = req.body;
    const option = SHIPPING_OPTIONS.find(o => o.name === method);
    if (!option) return res.status(400).json({ error: 'Invalid shipping method' });

    const cost = option.basePrice + (weight * option.perKg) + (distance * 0.01);
    res.json({
      method: option.name,
      cost: Math.round(cost * 100) / 100,
      estimatedDays: option.estimatedDays
    });
  } catch (err) {
    res.status(500).json({ error: 'Calculation failed' });
  }
});

module.exports = router;
