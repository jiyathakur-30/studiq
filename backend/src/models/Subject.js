import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  code: {
    type: String,
    default: '',
    trim: true
  },
  color: {
    type: String,
    default: '#6366f1' // Defaults to indigo brand color
  },
  professor: {
    type: String,
    default: '',
    trim: true
  },
  credits: {
    type: Number,
    default: 3
  }
}, {
  timestamps: true
});

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
