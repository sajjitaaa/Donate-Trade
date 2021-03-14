const User = require('./../model/userModel');
const catchError = require('./../utils/catchError');
const AppError = require('../utils/appError');
const factory = require('./../controller/factoryController');
const multer = require('multer');
const sharp = require('sharp');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! please upload an image.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizePhoto = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .withMetadata()
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

const objectFilter = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  console.log(req.user);
  req.params.id = req.user.id;
  next();
};
exports.updateMe = catchError(async (req, res, next) => {
  console.log(req.file);
  console.log(req.body);
  //1) If current user updates password here , give error
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError(
        'Password will not be updated here, Go to /updatePassword route!'
      )
    );
  }

  //2) Update the user's data
  const filterObject = objectFilter(req.body, 'name', 'email');
  if (req.file) filterObject.photo = req.file.filename;
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filterObject, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    updatedUser,
  });
});

exports.deleteMe = catchError(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'Route not defined! Sign up to create a user',
  });
};
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
