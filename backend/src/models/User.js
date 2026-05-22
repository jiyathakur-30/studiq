import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  profilePicture: {
    type: String,
    default: 'avatar-default'
  },
  googleOAuth: {
    accessToken: { type: String, default: null },
    refreshToken: { type: String, default: null },
    expiryDate: { type: Number, default: null },
    email: { type: String, default: null },
    isConnected: { type: Boolean, default: false }
  },
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'cyberpunk'],
      default: 'dark'
    },
    targetAttendance: {
      type: Number,
      default: 75
    },
    dailyStudyGoalMinutes: {
      type: Number,
      default: 60
    }
  },
  stats: {
    studyStreak: {
      type: Number,
      default: 0
    },
    lastActiveDate: {
      type: Date,
      default: Date.now
    },
    points: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Pre-save hook: Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
