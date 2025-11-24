const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/', paymentController.createPayment);
router.get('/client/:clientId', paymentController.getPaymentsByClientId);
router.delete('/:id', paymentController.deletePayment);

module.exports = router;
