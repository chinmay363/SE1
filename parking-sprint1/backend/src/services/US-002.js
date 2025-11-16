const express = require('express');
const Slot = require('../models/Slot');

module.exports = (io) => {
  const router = express.Router();

  router.get('/status', async (req, res) => {
    const total = await Slot.count();
    const occupied = await Slot.count({ where: { isOccupied: true } });
    const free = total - occupied;
    return res.json({ total, occupied, free });
  });

  router.get('/subscribe', (req, res) => {
    return res.json({ message: 'Use socket.io for real-time updates' });
  });

  io.on('connection', async (socket) => {
    const total = await Slot.count();
    const occupied = await Slot.count({ where: { isOccupied: true } });
    socket.emit('occupancy_update', { total, occupied, free: total - occupied });
  });

  return router;
};
