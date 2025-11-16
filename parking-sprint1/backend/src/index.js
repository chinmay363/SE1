const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/db');
const Slot = require('./models/Slot');
const Vehicle = require('./models/Vehicle');
const Session = require('./models/Session');
const Event = require('./models/Event');
require('dotenv').config();

const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.set('io', io);

// import services
app.use('/api/us-001', require('./services/US-001')(io));
app.use('/api/us-002', require('./services/US-002')(io));
app.use('/api/us-003', require('./services/US-003')(io));
app.use('/api/us-004', require('./services/US-004')(io));
app.use('/api/us-005', require('./services/US-005')(io));
app.use('/api/us-006', require('./services/US-006')(io));
app.use('/api/us-007', require('./services/US-007')(io));
app.use('/api/us-008', require('./services/US-008')(io));

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    const totalSlots = parseInt(process.env.TOTAL_SLOTS || 50, 10);
    const count = await Slot.count();
    if (count === 0) {
      for (let i = 1; i <= totalSlots; i++) {
        await Slot.create({ slotCode: `S${i}`, distanceRank: i });
      }
      console.log(`Seeded ${totalSlots} slots`);
    }

    server.listen(PORT, () => console.log(`Server running on ${PORT}`));
  } catch (err) {
    console.error('DB connection failed', err);
    process.exit(1);
  }
})();

module.exports = app;
