const express = require('express');
const viewController = require('./../controller/viewController.js');
const authenticationController = require('./../controller/authenticationController');
const bookingController = require('./../controller/bookingController');

const router = express.Router();

router.get(
  '/',
  authenticationController.isLoggedIn,
  viewController.getOverview
);
router.get(
  '/tour/:slug',
  authenticationController.isLoggedIn,
  viewController.getTours
);
router.get(
  '/login',
  authenticationController.isLoggedIn,
  viewController.getLogin
);
router.get('/me', authenticationController.protect, viewController.getAccount);

router.get(
  '/my-bookings',
  authenticationController.protect,
  viewController.getBookedTours
);

module.exports = router;
