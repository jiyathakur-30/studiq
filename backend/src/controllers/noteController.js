import Note from '../models/Note.js';

// @desc    Get all notes for a user
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ userId: req.user._id })
      .populate('subjectId', 'name color')
      .sort({ isPinned: -1, updatedAt: -1 });
    res.json({ success: true, notes });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res, next) => {
  try {
    const { title, content, subjectId, isPinned, tags } = req.body;

    const note = await Note.create({
      userId: req.user._id,
      subjectId: subjectId || null,
      title: title || 'Untitled Note',
      content: content || '',
      isPinned: isPinned || false,
      tags: tags || []
    });

    const populatedNote = await Note.findById(note._id).populate('subjectId', 'name color');
    res.status(201).json({ success: true, note: populatedNote });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });

    if (!note) {
      res.status(404);
      throw new Error('Note not found or unauthorized');
    }

    const { title, content, subjectId, isPinned, tags, aiSummary, flashcards } = req.body;

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (subjectId !== undefined) note.subjectId = subjectId || null;
    if (isPinned !== undefined) note.isPinned = isPinned;
    if (tags !== undefined) note.tags = tags;
    if (aiSummary !== undefined) note.aiSummary = aiSummary;
    if (flashcards !== undefined) note.flashcards = flashcards;

    await note.save();

    const updatedNote = await Note.findById(note._id).populate('subjectId', 'name color');
    res.json({ success: true, note: updatedNote });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });

    if (!note) {
      res.status(404);
      throw new Error('Note not found or unauthorized');
    }

    await Note.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Note Summarizer (Dynamic Mock Heuristic)
// @route   POST /api/notes/:id/summarize
// @access  Private
const summarizeNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });

    if (!note) {
      res.status(404);
      throw new Error('Note not found');
    }

    const contentText = note.content || '';
    let summary = '';

    if (contentText.trim().length < 10) {
      summary = "📝 This note is currently too short to be summarized. Please type some educational concepts to see the AI summarize it!";
    } else {
      // High-fidelity heuristic: extract sentences and keywords to build a realistic summary
      const sentences = contentText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
      const keywords = [...new Set(contentText.toLowerCase().match(/\b(react|typescript|algorithm|database|index|performance|memory|state|prop|render|effect|class|function|constant)\b/g) || ['study', 'academic', 'concept'])];
      
      summary = `### 🤖 STUDIQ AI Summary for "${note.title}"\n\n`;
      summary += `**Key Focus Area**: Primary lecture discussion relates to *${keywords.join(', ')}*.\n\n`;
      summary += `#### 💡 Essential Takeaways:\n`;
      
      if (sentences.length > 0) {
        sentences.slice(0, Math.min(sentences.length, 3)).forEach((sentence) => {
          summary += `- **Core Concept**: ${sentence}.\n`;
        });
      } else {
        summary += `- **Core Concept**: Synthesized note logs regarding ${note.title}.\n`;
      }
      summary += `- **Key Formula/Rule**: Ensure optimized revision before examination gates.\n\n`;
      summary += `*Generated automatically by STUDIQ Brain Engine on ${new Date().toLocaleDateString()}*`;
    }

    note.aiSummary = summary;
    await note.save();

    res.json({ success: true, aiSummary: summary });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Note Quiz Generator (Dynamic Mock Heuristic)
// @route   POST /api/notes/:id/quiz
// @access  Private
const generateQuiz = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });

    if (!note) {
      res.status(404);
      throw new Error('Note not found');
    }

    // High fidelity seed questions
    const mockFlashcards = [
      {
        question: `Based on your note "${note.title}", what is the primary core objective of studying this material?`,
        answer: "To master the foundational theory and apply it practically in solving problems."
      },
      {
        question: "How does periodic spacing (Active Recall) optimize learning retention?",
        answer: "It triggers neuroplasticity by forcing the brain to actively reconstruct concepts at regular intervals."
      },
      {
        question: "Which of the following is considered a best practice for high-efficiency note organization?",
        answer: "Categorizing logs by subjects, pinning milestones, and scheduling regular Pomodoro reviews."
      }
    ];

    note.flashcards = mockFlashcards;
    await note.save();

    res.json({ success: true, flashcards: mockFlashcards });
  } catch (error) {
    next(error);
  }
};

export {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  summarizeNote,
  generateQuiz
};
