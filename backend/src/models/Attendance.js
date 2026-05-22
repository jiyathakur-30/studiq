import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Record date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['attended', 'missed', 'cancelled'],
    required: [true, 'Attendance status is required']
  },
  note: {
    type: String,
    default: '',
    trim: true
  }
});

const attendanceSchema = new mongoose.Schema({
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
  records: [attendanceRecordSchema]
}, {
  timestamps: true
});

// Avoid duplicate schemas or references on index
attendanceSchema.index({ userId: 1, subjectId: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
