const express = require('express');
const { recognizeFromImageUrl } = require('../utils/plateRecognizer');
const Vehicle = require('../models/Vehicle');
const Event = require('../models/Event');

module.exports = (io) => {
  const router = express.Router();

  router.post('/recognize', async (req, res) => {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' });

    try {
      const data = await recognizeFromImageUrl(imageUrl);
      const plateObj = data.results && data.results[0];
      if (!plateObj) {
        await Event.create({ type: 'LPR_FAIL', message: 'No plate found', payload: { imageUrl } });
        return res.status(404).json({ error: 'Plate not recognized' });
      }
      const plate = plateObj.plate;
      const [vehicle] = await Vehicle.findOrCreate({ where: { plate }, defaults: { plate, isRegistered: false } });
      await Event.create({ type: 'LPR', message: `Recognized plate ${plate}`, payload: { plate }});
      return res.json({ plate, raw: plateObj });
    } catch (err) {
      await Event.create({ type: 'LPR_ERROR', message: err.message, payload: { imageUrl, error: err.message }});
      return res.status(500).json({ error: 'recognition error', details: err.message });
    }
  });

  return router;
};
