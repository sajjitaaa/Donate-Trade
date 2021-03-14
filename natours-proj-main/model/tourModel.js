const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    // SCHEMA FOR COLLECTION TOURS
    name: {
      type: String,
      required: [true, 'A name for tour is required'],
      unique: true,
      trim: true,
      maxlength: [40, 'Not more than 40 characters allowed!'],
      minlength: [10, 'Atleast 10 characters required!'],
      /*validate: {
        validator: validator.isAlpha,
        message: 'Not valid input',
      },*/
    },
    duration: {
      type: Number,
      required: [true, 'A tour must require a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A group size has to be specified'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty set'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'This difficulty is not accepted',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating should atleast be 1'],
      max: [5, 'Rating cant be more than 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A price should be given to the tour'],
    },
    slug: String,
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this only points to current document on NEW document create not on update//
          // val is the value inputed for priceDiscount field
          return val < this.price; //this is the current document
        },
        message: 'Discount price ({VALUE}) is more than price',
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, ' A summary is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      trim: true,
      required: [true, 'A image of tour is required'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String, // This is how we define a geospacial type
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//VIRTUAL FEATURES

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//DOCUMENT MIDDLEWARE - can run before or after an event like .save() and .create() not .insertMany()
tourSchema.pre('save', function (next) {
  console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

//embedding
/*
tourSchema.pre('save', async function (next) {
  const guidePromises = this.guides.map((id) => User.findById(id));
  this.guides = await Promise.all(guidePromises);
});
*/

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-passwordChangedAt',
  });
  next();
});

/*tourSchema.post(/^find/, function (docs, next) {
  console.log(`query took ${Date.now() - this.start} milliseconds!`);
});*/

//AGGREGATE MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
