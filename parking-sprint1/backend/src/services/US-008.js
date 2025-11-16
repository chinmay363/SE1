const express = require('express');
const Event = require('../models/Event');

module.exports = (io) => {
  const router = express.Router();

  router.get('/logs', async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const logs = await Event.findAll({ order: [['createdAt','DESC']], limit: parseInt(limit,10), offset: parseInt(offset,10)});
    return res.json({ logs });
  });

  router.post('/log', async (req,res) => {
    const { type, message, payload } = req.body;
    const e = await Event.create({ type, message, payload });
    io.emit('new_event', e);
    return res.json(e);
  });

  return router;
};
