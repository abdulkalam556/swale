const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    hashed_password: {
      type: String,
      required: true,
    },
    salt: String,
    resetLink: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['coustomer', 'vendor'],
      default: 'coustomer',
    },
    address: [
      {
        pincode: {
          type: Number,
          required: true,
          min: 100000,
          max: 999999,
          trim: true,
        },
        locailty: {
          type: String,
          retuired: true,
          trim: true,
          maxlength: 200,
        },
        state: {
          type: String,
          maxlength: 20,
          trim: true,
        },
        town: {
          type: String,
          maxlength: 20,
          trim: true,
        },
        district: {
          type: String,
          maxlength: 20,
          trim: true,
        },
        mobile: {
          type: Number,
          min: 1000000000,
          max: 9999999999,
        },
        isdefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'product',
        },
      },
    ],
    history: {
      type: String,
      trim: true,
      default: '',
    },
    orders: [
      {
        order: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'order',
        },
      },
    ],
  },
  { timestamps: true }
);

UserSchema.virtual('password')
  .set(function (password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

UserSchema.methods = {
  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },
  encryptPassword: function (password) {
    if (!password) return '';
    try {
      return crypto
        .createHmac('sha1', this.salt)
        .update(password)
        .digest('hex');
    } catch (err) {
      return '';
    }
  },
  makeSalt: function () {
    return Math.round(new Date().valueOf() * Math.random()) + '';
  },
};

module.exports = mongoose.model('User', UserSchema);
