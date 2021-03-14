const path = require('path');
const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');
const rateLimit = require('express-rate-limit');
const app = express();
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//1) GLOBAL MIDDLEWARE

//Static webpage
app.use(express.static(path.join(__dirname, 'public')));

//Set environment to development
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit no. of requests from  one IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP. Please try again after 1 hour.',
});
app.use('/api', limiter);

//Set http security headers
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'http://127.0.0.1:3000/*'],
      connectSrc: ["'self'", 'ws://localhost:8080/'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      scriptSrc: ["'self'", 'https://*.cloudflare.com'],
      scriptSrc: ["'self'", 'https://*.stripe.com'],
      frameSrc: ["'self'", 'https://*.stripe.com'],

      objectSrc: ["'none'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
    },
  })
);
//Body Parser. Reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

//Data Sanitization for NoSQL Query injection
app.use(mongoSanitize());

//Data Sanitization against XSS
app.use(xss());

//Preventing parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Testing middleware
app.use((req, res, next) => {
  console.log('Hello from the middleware!');

  next();
});
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

//Mounting our new routers to app on a specified route
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRoutes);

app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.statusCode = 404;
  // err.status = 'failed!';

  const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);
  next(err);
});

app.use(globalErrorHandler);
module.exports = app;
