const express = require('express');
const Slot = require('../models/Slot');
const Session = require('../models/Session');
const Vehicle = require('../models/Vehicle');
const Event = require('../models/Event');

module.exports = (io) => {
  const router = express.Router();

  router.post('/allocate', async (req, res) => {
    const { plate } = req.body;
    if (!plate) return res.status(400).json({ error: 'plate required' });

    const slot = await Slot.findOne({ where: { isOccupied: false }, order: [['distanceRank', 'ASC']] });
    if (!slot) {
      await Event.create({ type: 'DENY', message: 'Lot Full on allocation attempt', payload: { plate } });
      io.emit('occupancy_update', { status: 'full' });
      return res.status(409).json({ error: 'Lot Full' });
    }

    const [vehicle] = await Vehicle.findOrCreate({ where: { plate }, defaults: { plate, isRegistered: true } });
    const session = await Session.create({ VehicleId: vehicle.id, SlotId: slot.id });

    slot.isOccupied = true;
    await slot.save();

    await Event.create({ type: 'ALLOCATE', message: `Allocated slot ${slot.slotCode} to ${plate}`, payload: { plate, slot: slot.slotCode }});

    const occupiedCount = await Slot.count({ where: { isOccupied: true } });
    const total = await Slot.count();
    io.emit('occupancy_update', { occupiedCount, total });

    return res.json({ slotId: slot.slotCode, sessionId: session.id });
  });

  return router;
};
