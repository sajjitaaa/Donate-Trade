const Review = require('./../model/reviewModel');
//const catchError = require('./../utils/catchError');
const mongoose = require('mongoose');
const factory = require('./../controller/factoryController');

exports.setTourUserId = (req, res, next) => {
  if (!req.body.tours) req.body.tour = req.params.tourId;
  if (!req.body.users) req.body.user = req.user._id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.createReview = factory.createOne(Review);
exports.getReview = factory.getOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
