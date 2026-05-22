import Subject from '../models/Subject.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';

// @desc    Get all subjects for a user
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ userId: req.user._id });
    res.json({ success: true, subjects });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private
const createSubject = async (req, res, next) => {
  try {
    const { name, code, color, professor, credits } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Subject name is required');
    }

    const subject = await Subject.create({
      userId: req.user._id,
      name,
      code,
      color,
      professor,
      credits: Number(credits) || 3
    });

    // Automatically initialize empty attendance record set for this subject
    await Attendance.create({
      userId: req.user._id,
      subjectId: subject._id,
      records: []
    });

    res.status(201).json({ success: true, subject });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private
const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id });

    if (!subject) {
      res.status(404);
      throw new Error('Subject not found or unauthorized');
    }

    const { name, code, color, professor, credits } = req.body;
    if (name) subject.name = name;
    if (code !== undefined) subject.code = code;
    if (color) subject.color = color;
    if (professor !== undefined) subject.professor = professor;
    if (credits !== undefined) subject.credits = Number(credits);

    const updatedSubject = await subject.save();
    res.json({ success: true, subject: updatedSubject });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a subject (cascades)
// @route   DELETE /api/subjects/:id
// @access  Private
const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id });

    if (!subject) {
      res.status(404);
      throw new Error('Subject not found or unauthorized');
    }

    // Cascading deletion
    await Subject.deleteOne({ _id: req.params.id });
    await Attendance.deleteOne({ subjectId: req.params.id });
    await Assignment.deleteMany({ subjectId: req.params.id });

    res.json({ success: true, message: 'Subject and all associated attendance/assignments deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject
};
