import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema({
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
  durationMinutes: {
    type: Number,
    required: [true, 'Session duration in minutes is required'],
    min: [1, 'Session must be at least 1 minute']
  },
  mode: {
    type: String,
    enum: ['pomodoro', 'deep_work'],
    default: 'pomodoro'
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

const StudySession = mongoose.model('StudySession', studySessionSchema);
export default StudySession;
