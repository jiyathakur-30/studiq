import Attendance from '../models/Attendance.js';

// @desc    Get attendance records for all subjects
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.find({ userId: req.user._id });
    res.json({ success: true, attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Log/Add an attendance record for a subject
// @route   POST /api/attendance/:subjectId
// @access  Private
const logAttendance = async (req, res, next) => {
  try {
    const { date, status, note } = req.body;
    const { subjectId } = req.params;

    if (!status) {
      res.status(400);
      throw new Error('Attendance status is required');
    }

    let attendanceDoc = await Attendance.findOne({ userId: req.user._id, subjectId });

    if (!attendanceDoc) {
      attendanceDoc = new Attendance({
        userId: req.user._id,
        subjectId,
        records: []
      });
    }

    // Add new record
    attendanceDoc.records.push({
      date: date ? new Date(date) : new Date(),
      status,
      note: note || ''
    });

    const savedDoc = await attendanceDoc.save();

    res.status(201).json({
      success: true,
      records: savedDoc.records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Remove an attendance record from a subject
// @route   DELETE /api/attendance/:subjectId/record/:recordId
// @access  Private
const deleteAttendanceRecord = async (req, res, next) => {
  try {
    const { subjectId, recordId } = req.params;

    const attendanceDoc = await Attendance.findOne({ userId: req.user._id, subjectId });

    if (!attendanceDoc) {
      res.status(404);
      throw new Error('Attendance document not found');
    }

    // Remove the specific sub-record
    attendanceDoc.records = attendanceDoc.records.filter(
      (rec) => rec._id.toString() !== recordId
    );

    const savedDoc = await attendanceDoc.save();

    res.json({
      success: true,
      records: savedDoc.records
    });
  } catch (error) {
    next(error);
  }
};

export {
  getAttendance,
  logAttendance,
  deleteAttendanceRecord
};
