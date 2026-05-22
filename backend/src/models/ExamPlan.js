import mongoose from 'mongoose';

const examPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  examDate: {
    type: Date,
    required: [true, 'Exam date is required']
  },
  chapters: [{
    type: String,
    trim: true
  }],
  confidenceLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  studyHoursGoal: {
    type: Number,
    default: 10
  },
  isAiOptimized: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const ExamPlan = mongoose.model('ExamPlan', examPlanSchema);
export default ExamPlan;
