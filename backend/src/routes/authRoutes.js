import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserSettings
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/settings', protect, updateUserSettings);

export default router;
