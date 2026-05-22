import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  }
});

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    default: null
  },
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    default: 'Untitled Note'
  },
  content: {
    type: String,
    default: ''
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  aiSummary: {
    type: String,
    default: ''
  },
  flashcards: [flashcardSchema]
}, {
  timestamps: true
});

const Note = mongoose.model('Note', noteSchema);
export default Note;
