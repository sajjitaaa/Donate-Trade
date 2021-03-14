const Tour = require('./../model/tourModel');
const catchError = require('./../utils/catchError');
const AppError = require('./../utils/appError');
const factory = require('./../controller/factoryController');
const Bookings = require('./../model/bookingModel');
const { create } = require('./../model/tourModel');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchError(async (req, res, next) => {
  //1) Get the tour to buy
  const tour = await Tour.findById(req.params.tourId);

  //2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  //3) send session to client
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.bookingCheckout = catchError(async (req, res, next) => {
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();

  await Bookings.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
});
