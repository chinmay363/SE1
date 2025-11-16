const express = require('express');
const Slot = require('../models/Slot');
const Event = require('../models/Event');

module.exports = (io) => {
  const router = express.Router();

  router.get('/check', async (req, res) => {
    const total = await Slot.count();
    const occupied = await Slot.count({ where: { isOccupied: true } });
    const free = total - occupied;
    if (free <= 0) {
      await Event.create({ type: 'LOT_FULL', message: 'Lot is full' });
      io.emit('lot_full', { message: 'Lot Full' });
      return res.status(409).json({ status: 'full', message: 'Lot Full' });
    }
    return res.json({ status: 'ok', free });
  });

  return router;
};
