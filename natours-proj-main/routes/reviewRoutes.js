const express = require('express');
const reviewController = require('./../controller/reviewController');
const authenticationController = require('./../controller/authenticationController');

const router = express.Router({
  mergeParams: true,
});

router.use(authenticationController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authenticationController.restrictRole('user'),
    reviewController.setTourUserId,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    authenticationController.restrictRole('admin', 'user'),
    reviewController.deleteReview
  )
  .patch(
    authenticationController.restrictRole('admin', 'user'),
    reviewController.updateReview
  );

module.exports = router;
