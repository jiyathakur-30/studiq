import Assignment from '../models/Assignment.js';

// @desc    Get all assignments for a user
// @route   GET /api/assignments
// @access  Private
const getAssignments = async (req, res, next) => {
  try {
    const assignments = await Assignment.find({ userId: req.user._id })
      .populate('subjectId', 'name color')
      .sort({ dueDate: 1 });
    res.json({ success: true, assignments });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private
const createAssignment = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, status, subjectId, subtasks } = req.body;

    if (!title || !dueDate) {
      res.status(400);
      throw new Error('Title and Due Date are required fields');
    }

    const assignment = await Assignment.create({
      userId: req.user._id,
      subjectId: subjectId || null,
      title,
      description: description || '',
      dueDate: new Date(dueDate),
      priority: priority || 'medium',
      status: status || 'todo',
      subtasks: subtasks || []
    });

    const populatedAssignment = await Assignment.findById(assignment._id).populate('subjectId', 'name color');

    res.status(201).json({ success: true, assignment: populatedAssignment });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an assignment (including Kanban position shifts)
// @route   PUT /api/assignments/:id
// @access  Private
const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, userId: req.user._id });

    if (!assignment) {
      res.status(404);
      throw new Error('Assignment not found or unauthorized');
    }

    const { title, description, dueDate, priority, status, subjectId, subtasks } = req.body;

    if (title) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (dueDate) assignment.dueDate = new Date(dueDate);
    if (priority) assignment.priority = priority;
    if (status) assignment.status = status;
    if (subjectId !== undefined) assignment.subjectId = subjectId || null;
    if (subtasks) assignment.subtasks = subtasks;

    await assignment.save();
    
    const updatedAssignment = await Assignment.findById(assignment._id).populate('subjectId', 'name color');
    res.json({ success: true, assignment: updatedAssignment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an assignment
// @route   DELETE /api/assignments/:id
// @access  Private
const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, userId: req.user._id });

    if (!assignment) {
      res.status(404);
      throw new Error('Assignment not found or unauthorized');
    }

    await Assignment.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment
};
