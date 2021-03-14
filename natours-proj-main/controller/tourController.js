const Tour = require('./../model/tourModel');
const { nextTick } = require('process');
const { resolveSoa } = require('dns');
const { create } = require('./../model/tourModel');
const { Console } = require('console');
const multer = require('multer');
const sharp = require('sharp');

const catchError = require('./../utils/catchError');
const AppError = require('./../utils/appError');
const factory = require('./../controller/factoryController');

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

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

//upload.single('imageCover');//req.file
//upload.array('images', 3); req.files

exports.resizeImages = catchError(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  //imageCover
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .withMetadata()
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const tourImagesFilename = `tour-${req.params.id}-${Date.now()}-${
        i + 1
      }.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .withMetadata()
        .toFile(`public/img/tours/${tourImagesFilename}`);

      req.body.images.push(tourImagesFilename);
    })
  );
  console.log(req.body);
  next();
});

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.duration) {
    return res.status(400).json({
      status: 'failure',
      message: 'invalid request made!',
    });
  }
  next();
};
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
exports.createTour = factory.createOne(Tour);

exports.getTourStats = catchError(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: -1,
      },
    },
  ]);
  res.status(201).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchError(async (req, res, next) => {
  const year = req.params.year;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        Tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTours: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(201).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
//'/tour-within/:distance/centre/:latlng/units/:units'
//'tour-within/233/centre/144,566/units/km'
exports.getTourWithin = catchError(async (req, res, next) => {
  const { distance, latlng, units } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    const err = new AppError('Please enter some latitude and longitude!', 400);
    return next(err);
  }
  const radius = units === 'mi' ? distance / 3963.2 : distance / 6378.1;

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: tours,
  });
});

exports.getTourDistances = catchError(async (req, res, next) => {
  const { latlng, units } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    const err = new AppError('Please enter some latitude and longitude!', 400);
    return next(err);
  }
  const multiplier = units === 'mi' ? 0.000621371 : 0.001;

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    result: distances.length,
    data: distances,
  });
});
