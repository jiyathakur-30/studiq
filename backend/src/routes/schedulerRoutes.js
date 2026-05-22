import express from 'express';
import {
  getGoogleAuthUrl,
  googleCallback,
  disconnectGoogleCalendar,
  getScheduledSessions,
  getExamPlans,
  createOrUpdateExamPlan,
  updateSessionStatus,
  getSchedulerDashboardStats,
  generateAcademicPlan,
  rescheduleMissedSessions
} from '../controllers/schedulerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public callback handler for Google OAuth redirect
router.get('/google/callback', googleCallback);

// Secure all other routes with protect JWT middleware
router.use(protect);

router.get('/google/url', getGoogleAuthUrl);
router.post('/google/disconnect', disconnectGoogleCalendar);
router.get('/dashboard-stats', getSchedulerDashboardStats);

router.route('/sessions')
  .get(getScheduledSessions);

router.route('/sessions/:id')
  .put(updateSessionStatus);

router.route('/exams')
  .get(getExamPlans)
  .post(createOrUpdateExamPlan);

router.post('/generate-plan', generateAcademicPlan);
router.post('/reschedule-missed', rescheduleMissedSessions);

export default router;
