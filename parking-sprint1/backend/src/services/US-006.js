const express = require('express');
const Vehicle = require('../models/Vehicle');
const Event = require('../models/Event');

module.exports = (io) => {
  const router = express.Router();

  router.post('/check', async (req, res) => {
    const { plate } = req.body;
    if (!plate) return res.status(400).json({ error: 'plate required' });

    const vehicle = await Vehicle.findOne({ where: { plate }});
    const registered = vehicle && vehicle.isRegistered;
    if (!registered) {
      await Event.create({ type: 'DENIED', message: `Unregistered plate denied: ${plate}`, payload: { plate }});
      io.emit('alert', { type: 'UNREGISTERED', plate });
      return res.status(403).json({ allowed: false, reason: 'unregistered' });
    }
    return res.json({ allowed: true });
  });

  return router;
};
