import StudySession from '../models/StudySession.js';
import User from '../models/User.js';

// @desc    Get all study sessions for a user
// @route   GET /api/study
// @access  Private
const getStudySessions = async (req, res, next) => {
  try {
    const sessions = await StudySession.find({ userId: req.user._id })
      .populate('subjectId', 'name color')
      .sort({ date: -1 });
    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
};

// @desc    Log a new study focus session and update user streak gamification
// @route   POST /api/study
// @access  Private
const logStudySession = async (req, res, next) => {
  try {
    const { subjectId, durationMinutes, mode, notes } = req.body;

    if (!durationMinutes) {
      res.status(400);
      throw new Error('Duration is required to log a session');
    }

    const session = await StudySession.create({
      userId: req.user._id,
      subjectId: subjectId || null,
      durationMinutes: Number(durationMinutes),
      mode: mode || 'pomodoro',
      notes: notes || ''
    });

    // Gamification & Streak Check
    const user = await User.findById(req.user._id);
    if (user) {
      const now = new Date();
      const lastActive = new Date(user.stats.lastActiveDate);

      // Check if last study was yesterday
      const diffTime = Math.abs(now - lastActive);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        // Studied today or yesterday: maintain/increment streak if on a new calendar day
        const isSameDay = now.toDateString() === lastActive.toDateString();
        if (!isSameDay) {
          user.stats.studyStreak += 1;
        }
      } else {
        // Streak broken: reset to 1
        user.stats.studyStreak = 1;
      }

      // Add points based on minutes (e.g. 10 points per 25 min)
      user.stats.points += Math.floor(Number(durationMinutes) * 0.4);
      user.stats.lastActiveDate = now;

      await user.save();
    }

    const populatedSession = await StudySession.findById(session._id).populate('subjectId', 'name color');

    res.status(201).json({
      success: true,
      session: populatedSession,
      streak: user ? user.stats.studyStreak : 0,
      points: user ? user.stats.points : 0
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregated statistics for charts
// @route   GET /api/study/stats
// @access  Private
const getStudyStats = async (req, res, next) => {
  try {
    const sessions = await StudySession.find({ userId: req.user._id });

    // Compute total focus minutes
    const totalMinutes = sessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);

    // Group sessions by day for the last 7 days (Weekly Study Graph Recharts)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({
        dateString: d.toDateString(),
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        minutes: 0
      });
    }

    sessions.forEach((s) => {
      const sDateString = new Date(s.date).toDateString();
      const match = last7Days.find(d => d.dateString === sDateString);
      if (match) {
        match.minutes += s.durationMinutes;
      }
    });

    res.json({
      success: true,
      totalMinutes,
      totalSessions: sessions.length,
      weeklyChartData: last7Days.map(d => ({ day: d.dayLabel, minutes: d.minutes }))
    });
  } catch (error) {
    next(error);
  }
};

export {
  getStudySessions,
  logStudySession,
  getStudyStats
};
