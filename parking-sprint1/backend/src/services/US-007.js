const express = require('express');
const Vehicle = require('../models/Vehicle');
const Event = require('../models/Event');

module.exports = (io) => {
  const router = express.Router();

  router.post('/verify', async (req, res) => {
    const { plate } = req.body;
    if (!plate) return res.status(400).json({ error: 'plate required' });

    const vehicle = await Vehicle.findOne({ where: { plate }});
    if (!vehicle || !vehicle.isRegistered) {
      await Event.create({ type: 'VERIF_FAIL', message: `Verification failed for ${plate}`, payload: { plate }});
      return res.status(403).json({ verified: false });
    }
    await Event.create({ type: 'VERIF_OK', message: `Verified ${plate}`, payload: { plate }});
    return res.json({ verified: true, vehicle: { plate: vehicle.plate, ownerName: vehicle.ownerName } });
  });

  return router;
};
