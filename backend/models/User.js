const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    // =====================================================
    // BASIC INFORMATION
    // =====================================================

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String,
      default: null,
    },

    // =====================================================
    // AUTHENTICATION
    // =====================================================

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: [
        'citizen',
        'university',
        'student',
        'industry',
        'admin',
      ],
      default: 'citizen',
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    refreshToken: {
      type: String,
      select: false,
      default: null,
    },

    // =====================================================
    // GAMIFICATION
    // =====================================================

    badges: {
      type: [
        {
          id: {
            type: String,
            required: true,
          },

          name: {
            type: String,
            required: true,
          },

          icon: {
            type: String,
          },

          desc: {
            type: String,
          },

          earned: {
            type: Boolean,
            default: false,
          },

          earnedAt: {
            type: Date,
            default: null,
          },
        },
      ],
      default: [],
    },

    // Quick-access statistics
    totalSubmitted: {
      type: Number,
      default: 0,
      min: 0,
    },

    challengesSolved: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalUpvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);


// =========================================================
// PASSWORD HASHING
// =========================================================

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);

  this.password = await bcrypt.hash(
    this.password,
    salt
  );

  next();
});


// =========================================================
// PASSWORD COMPARISON
// =========================================================

UserSchema.methods.matchPassword = async function (plainPassword) {
  return bcrypt.compare(
    plainPassword,
    this.password
  );
};


// =========================================================
// JSON RESPONSE
// Never expose sensitive authentication data
// =========================================================

UserSchema.methods.toJSON = function () {
  const user = this.toObject();

  delete user.password;
  delete user.refreshToken;

  return user;
};


module.exports = mongoose.model('User', UserSchema);
