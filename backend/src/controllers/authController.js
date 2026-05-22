import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenUtils.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with that email or username');
    }

    // Create user (pre-save hook hashes password)
    const user = await User.create({
      username,
      email,
      password
    });

    if (user) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      res.status(201).json({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
          settings: user.settings,
          stats: user.stats
        }
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data provided');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Update last active date
      user.stats.lastActiveDate = new Date();
      await user.save();

      res.json({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
          settings: user.settings,
          stats: user.stats
        }
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
          settings: user.settings,
          stats: user.stats
        }
      });
    } else {
      res.status(444);
      throw new Error('User profile not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile & settings
// @route   PUT /api/auth/settings
// @access  Private
const updateUserSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      const { theme, targetAttendance, dailyStudyGoalMinutes, profilePicture } = req.body;

      if (theme) user.settings.theme = theme;
      if (targetAttendance !== undefined) user.settings.targetAttendance = Number(targetAttendance);
      if (dailyStudyGoalMinutes !== undefined) user.settings.dailyStudyGoalMinutes = Number(dailyStudyGoalMinutes);
      if (profilePicture) user.profilePicture = profilePicture;

      const updatedUser = await user.save();

      res.json({
        success: true,
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          profilePicture: updatedUser.profilePicture,
          settings: updatedUser.settings,
          stats: updatedUser.stats
        }
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

export {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserSettings
};
