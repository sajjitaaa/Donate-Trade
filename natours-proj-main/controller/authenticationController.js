const User = require('./../model/userModel');
const catchError = require('./../utils/catchError');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const { promisify } = require('util');
const { findOne } = require('./../model/userModel');
const Email = require('./../utils/email');
const crypto = require('crypto');

const tokenSign = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendToken = (user, statusCode, res) => {
  const token = tokenSign(user._id);

  //Send cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);
  //Remove password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchError(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });
  const url = `${req.protocol}://${req.get('host')}/`;
  console.log(url);
  const email = new Email(newUser, url);
  await email.sendWelcome();
  sendToken(newUser, 201, res);
});

exports.login = catchError(async (req, res, next) => {
  const { email, password } = req.body;
  //1) Check if the email and password exists
  if (!email || !password) {
    const err = new AppError('Please provide email and password!', 400);
    return next(err);
  }

  //2) Check if the user exist and password is correct

  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(user.password, password))) {
    const err = new AppError('Please enter a valid email or password!', 400);
    return next(err);
  }
  //res.set('Cache-Control','no-cache ,private ,no-store ,must-revalidate ,post-check=0 ,pre-check=0' )
  sendToken(user, 200, res);
});



//for accessing routes AUTHENTIFICATION
exports.protect = catchError(async (req, res, next) => {
  let token;

  //1) Get token and check if its there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    const err = new AppError(
      'You not logged in! Please log in to access.',
      401
    );
    return next(err);
  }

  //Verification of the token
  const decoded = await jwt.verify(token, process.env.JWT_SECRET);

  //Check if the user still exists
  currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('User belonging to this token no longer exist!'),
      401
    );
  }

  //Check if user changed password after token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password!. Please log in again', 401)
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  //console.log(currentUser);

  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      //Verify the cookie
      
      const decoded = await jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);

      //Check if the user still exists
      currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //Check if user changed password after token was issued
      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }

      //THERE IS A LOGGED IN USER

      res.locals.user = currentUser;
      console.log('detail');
      res.set('Cache-Control','no-cache ,private ,no-store ,must-revalidate ,post-check=0 ,pre-check=0' )
      return next();
    }
    
  } catch (err) {
    return next();
  }
  
  next();
};

//authorization
exports.restrictRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action!', 403)
      );
    }
    next();
  };
};


exports.logout = (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  //res.set('Cache-Control','no-cache ,private ,no-store ,must-revalidate ,post-check=0 ,pre-check=0' )
  res.status(200).json({
    status: 'success',
  });
};

exports.forgotPassword = catchError(async (req, res, next) => {
  //1) get the user by email POSTed
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email id!'));
  }
  //2) Generate a random reset token
  const resetToken = user.createpasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3) send email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const email = new Email(user, resetURL);
  await email.sendResetPassword();

  res.status(200).json({
    status: 'success',
    message: 'email sent',
  });
});

exports.resetPassword = catchError(async (req, res, next) => {
  //1) Get user based on token
  const hashtoken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    PasswordResetToken: hashtoken,
    PasswordTokenExpires: { $gt: Date.now() },
  });
  //2) If the token has not expired and user is found, then set password
  if (!user) {
    return next(new AppError('Token expired or user not found!', 400));
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.PasswordResetToken = undefined;
  user.PasswordTokenExpires = undefined;
  await user.save();

  //3) update changedPasswordAt propert in db

  //4) Generate token to log in
  sendToken(user, 200, res);
});

exports.updatePassword = catchError(async (req, res, next) => {
  //1) Get the current user
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new AppError('User not found!', 404));
  }

  //2) Check if the passowrd POSTed is correct
  console.log(user.password, req.body.currentPassword);
  if (!(await user.correctPassword(user.password, req.body.currentPassword))) {
    return next(
      new AppError('The password provided is incorrect for this user!', 401)
    );
  }

  //3) If so, update the password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  //4) Log in the user, send the JWT token
  sendToken(user, 200, res);
});
