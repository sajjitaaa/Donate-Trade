const express = require('express');
const bookingController = require('./../controller/bookingController');
const authenticationController = require('./../controller/authenticationController');

const router = express.Router();

router.get(
  '/checkout-session/:tourId',
  authenticationController.protect,
  bookingController.getCheckoutSession
);

module.exports = router;
