const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  //SCHEMA FOR USERS
  name: {
    type: String,
    required: [true, 'A name is required!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email!'],
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email!',
    },
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['admin', 'guide', 'lead-guide', 'user'],
    default: 'user',
  },

  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please confirm your password!'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password confirmation wrong!',
    },
  },
  passwordChangedAt: Date,
  PasswordResetToken: String,
  PasswordTokenExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//encrypting our password
userSchema.pre('save', async function (next) {
  //   //ONLY ENCRYPT WHEN PASSWORD IS SAVED OR MODIFIED
  if (!this.isModified('password')) return next();

  //ENCRYPT PASSWORD OF CURRENT DOCUMENT
  this.password = await bcrypt.hash(this.password, 12);

  // DELETE PASSWORD FIELD FROM DATABASE
  this.confirmPassword = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  userPassword,
  candidatePassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTtimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimeStamp, JWTtimestamp);
    return changedTimeStamp > JWTtimestamp;
  }

  return false;
};

userSchema.methods.createpasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.PasswordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.PasswordTokenExpires = Date.now() + 10 * 60 * 1000;

  console.log({ resetToken }, this.PasswordResetToken);
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
