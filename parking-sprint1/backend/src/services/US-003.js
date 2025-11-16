const express = require('express');
const barrier = require('../utils/barrierSim');
const Slot = require('../models/Slot');
const Session = require('../models/Session');
const Vehicle = require('../models/Vehicle');
const Event = require('../models/Event');

module.exports = (io) => {
  const router = express.Router();

  router.post('/entry', async (req, res) => {
    const { plate } = req.body;
    if (!plate) return res.status(400).json({ error: 'plate required' });

    const vehicle = await Vehicle.findOne({ where: { plate }});
    if (!vehicle || !vehicle.isRegistered) {
      await Event.create({ type: 'DENIED', message: `Unregistered vehicle tried entry: ${plate}`, payload: { plate }});
      return res.status(403).json({ error: 'Unregistered or unauthorized' });
    }

    const slot = await Slot.findOne({ where: { isOccupied: false }, order: [['distanceRank','ASC']] });
    if (!slot) {
      await Event.create({ type: 'DENIED', message: 'Lot Full on entry attempt', payload: { plate }});
      return res.status(409).json({ error: 'Lot Full' });
    }

    const session = await Session.create({ VehicleId: vehicle.id, SlotId: slot.id });
    slot.isOccupied = true;
    await slot.save();

    barrier.open();
    await Event.create({ type: 'ENTRY', message: `Barrier opened for ${plate} into ${slot.slotCode}`, payload: { plate, slot: slot.slotCode }});
    const occupied = await Slot.count({ where: { isOccupied: true } });
    const total = await Slot.count();
    io.emit('occupancy_update', { occupied, total });

    return res.json({ ok: true, barrierState: barrier.getState(), slot: slot.slotCode, sessionId: session.id });
  });

  router.get('/status', (req,res)=> res.json({ barrierState: barrier.getState() }) );

  return router;
};
