const catchError = require('./../utils/catchError');
const AppError = require('./../utils/appError');
const { populate } = require('../model/userModel');
const APIfeatures = require('./../utils/tourFeatures');

exports.deleteOne = (Model) =>
  catchError(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!Model) {
      const err = new AppError('Cannot find the document with that id', 404);
      return next(err);
    }
    res.status(204).json({
      status: 'sucess',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchError(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      const err = new AppError('Cannot find the doc with that id', 404);
      return next(err);
    }
    res.status(200).json({
      status: 'sucess',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchError(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        doc: newDoc,
      },
    });
  });

exports.getOne = (Model, populateOption) =>
  catchError(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOption) query = query.populate(populateOption);

    const doc = await query;

    if (!doc) {
      const err = new AppError('Cannot find the document with that id', 404);
      return next(err);
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchError(async (req, res, next) => {
    //for reviews
    let filter = {};
    if (req.params.tourId) filter = { tours: req.params.tourId };

    //EXECUTE THE QUERY
    const features = new APIfeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;

    //SEND BACK RESPONSE
    res.status(200).json({
      status: 'success',
      requestTime: req.requestTime,
      data: {
        data: doc,
      },
    });
  });
