const express = require('express');
const tourController = require('./../controller/tourController');
const authenticationController = require('./../controller/authenticationController');
const reviewController = require('./../controller/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

//Nesting routes
router.use('/:tourId/reviews', reviewRouter);

//ALIASING
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/tourMonthly/:year')
  .get(
    authenticationController.protect,
    authenticationController.restrictRole('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    tourController.checkBody,
    authenticationController.protect,
    authenticationController.restrictRole('admin', 'lead-guide'),
    tourController.createTour
  );
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authenticationController.protect,
    authenticationController.restrictRole('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeImages,
    tourController.updateTour
  )
  .delete(
    authenticationController.protect,
    authenticationController.restrictRole('admin', 'lead-guide'),
    tourController.deleteTour
  );

router
  .route('/tour-within/:distance/centre/:latlng/units/:units')
  .get(tourController.getTourWithin);

router
  .route('/distance/:latlng/units/:units')
  .get(tourController.getTourDistances);

module.exports = router;
