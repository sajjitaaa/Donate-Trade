const Bookings = require('../model/bookingModel');
const Tour = require('./../model/tourModel');
const catchError = require('./../utils/catchError');
const { login } = require('./authenticationController');

exports.getOverview = catchError(async (req, res, next) => {
  const tours = await Tour.find();
 
  res.status(200).render('overview', {
    title: 'All Tours',
    tours: tours,
  });
});

exports.getTours = catchError(async (req, res) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  
  res.status(200).render('tour', {
    title: 'The Forest Hiker',
    tour,
  });
});

exports.getLogin = catchError(async (req, res) => {
  
  res.status(200).render('login', {
    title: 'Log into your account',
  });
});

exports.getAccount = catchError(async (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account',
  });
});

exports.getBookedTours = catchError(async (req, res) => {
  //1) Find bookings on a user
  const bookings = await Bookings.find({ user: req.user.id });

  //2) Find tours on the bookings found above
  const tourId = bookings.map((el) => {
    return el.tour._id;
  });

  //3) Find all the tours corresponding the tourid
  const tours = await Tour.find({ _id: { $in: tourId } });

  res.status(200).render('bookedTours', {
    title: 'Your Bookings',
    tours,
  });
});
