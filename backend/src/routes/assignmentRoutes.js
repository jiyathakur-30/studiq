import express from 'express';
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment
} from '../controllers/assignmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Secure all assignment routes

router.route('/')
  .get(getAssignments)
  .post(createAssignment);

router.route('/:id')
  .put(updateAssignment)
  .delete(deleteAssignment);

export default router;
