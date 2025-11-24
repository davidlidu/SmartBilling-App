const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/profile', settingsController.getSenderProfile);
router.post('/profile', settingsController.updateSenderProfile); // Using POST for create or update

module.exports = router;
