import mongoose from 'mongoose';

const scheduledSessionSchema = new mongoose.Schema({
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
    required: [true, 'Session title is required'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'missed'],
    default: 'scheduled'
  },
  googleCalendarEventId: {
    type: String,
    default: null
  },
  isAiGenerated: {
    type: Boolean,
    default: true
  },
  rescheduleCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const ScheduledSession = mongoose.model('ScheduledSession', scheduledSessionSchema);
export default ScheduledSession;
