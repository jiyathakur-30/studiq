import express from 'express';
import {
  getAttendance,
  logAttendance,
  deleteAttendanceRecord
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Secure all attendance routes

router.route('/')
  .get(getAttendance);

router.route('/:subjectId')
  .post(logAttendance);

router.route('/:subjectId/record/:recordId')
  .delete(deleteAttendanceRecord);

export default router;
