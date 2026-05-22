import express from 'express';
import {
  getStudySessions,
  logStudySession,
  getStudyStats
} from '../controllers/studySessionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Secure all study routes

router.route('/')
  .get(getStudySessions)
  .post(logStudySession);

router.get('/stats', getStudyStats);

export default router;
