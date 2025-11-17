const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

router.get('/occupancy', adminController.getOccupancy);
router.get('/revenue', adminController.getRevenue);
router.get('/logs', adminController.getLogs);
router.get('/events', adminController.getSystemEvents);
router.get('/traffic', adminController.getTrafficAnalytics);
router.get('/dashboard', adminController.getDashboard);
router.post('/reset-system', adminController.resetSystem);

module.exports = router;
