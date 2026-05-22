import express from 'express';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  summarizeNote,
  generateQuiz
} from '../controllers/noteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Secure all note routes

router.route('/')
  .get(getNotes)
  .post(createNote);

router.route('/:id')
  .put(updateNote)
  .delete(deleteNote);

router.post('/:id/summarize', summarizeNote);
router.post('/:id/quiz', generateQuiz);

export default router;
