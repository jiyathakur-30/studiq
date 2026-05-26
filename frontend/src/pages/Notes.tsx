import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Search,
  Pin,
  Tag,
  ChevronRight,
  Sparkles,
  Check,
  X,
  ArrowRight,
  Trash2,
  Edit3,
  Eye,
  Brain,
  HelpCircle,
  FileText,
  PinOff,
  FolderOpen
} from 'lucide-react';
import { useAppStore } from '../context/store';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

// Helper: Custom Inline Markdown Parser for split preview
const parseInlineMarkdown = (text: string) => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    const boldIndex = remaining.indexOf('**');
    const codeIndex = remaining.indexOf('`');

    if (boldIndex === -1 && codeIndex === -1) {
      parts.push(<span key={keyIndex++}>{remaining}</span>);
      break;
    }

    if (boldIndex !== -1 && (codeIndex === -1 || boldIndex < codeIndex)) {
      if (boldIndex > 0) {
        parts.push(<span key={keyIndex++}>{remaining.substring(0, boldIndex)}</span>);
      }
      const nextBold = remaining.indexOf('**', boldIndex + 2);
      if (nextBold === -1) {
        parts.push(<span key={keyIndex++}>{remaining.substring(boldIndex)}</span>);
        break;
      } else {
        parts.push(
          <strong key={keyIndex++} className="font-extrabold text-foreground">
            {remaining.substring(boldIndex + 2, nextBold)}
          </strong>
        );
        remaining = remaining.substring(nextBold + 2);
      }
    } else {
      if (codeIndex > 0) {
        parts.push(<span key={keyIndex++}>{remaining.substring(0, codeIndex)}</span>);
      }
      const nextCode = remaining.indexOf('`', codeIndex + 1);
      if (nextCode === -1) {
        parts.push(<span key={keyIndex++}>{remaining.substring(codeIndex)}</span>);
        break;
      } else {
        parts.push(
          <code key={keyIndex++} className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-xs text-brand-600 dark:text-brand-400">
            {remaining.substring(codeIndex + 1, nextCode)}
          </code>
        );
        remaining = remaining.substring(nextCode + 1);
      }
    }
  }
  return parts;
};

const renderMarkdown = (text: string) => {
  if (!text) {
    return <p className="text-muted-foreground italic text-sm">Empty note. Draft lectures using headers (#), bullets (-), or bold (**).</p>;
  }

  const lines = text.split('\n');
  return lines.map((line, idx) => {
    if (line.startsWith('# ')) {
      return (
        <h1 key={idx} className="text-2xl font-black text-foreground mt-4 mb-2 tracking-tight border-b border-border pb-1">
          {line.substring(2)}
        </h1>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={idx} className="text-xl font-extrabold text-foreground mt-4 mb-2 tracking-tight">
          {line.substring(3)}
        </h2>
      );
    }
    if (line.startsWith('### ')) {
      return (
        <h3 key={idx} className="text-lg font-bold text-foreground mt-3 mb-1">
          {line.substring(4)}
        </h3>
      );
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = parseInlineMarkdown(line.substring(2));
      return (
        <li key={idx} className="list-disc list-inside text-sm text-muted-foreground ml-4 py-0.5">
          {content}
        </li>
      );
    }
    if (line.trim() === '---') {
      return <hr key={idx} className="border-border my-4" />;
    }
    if (line.trim() === '') {
      return <div key={idx} className="h-2" />;
    }
    return (
      <p key={idx} className="text-sm text-foreground leading-relaxed mb-1">
        {parseInlineMarkdown(line)}
      </p>
    );
  });
};

export const Notes: React.FC = () => {
  const {
    notes,
    subjects,
    addNote,
    updateNote,
    deleteNote,
    summarizeNote,
    generateQuizFromNote,
    updateSettings // For adding points when correct
  } = useAppStore();

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [newTagInput, setNewTagInput] = useState('');
  
  // AI Panel states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activePanel, setActivePanel] = useState<'none' | 'summary' | 'quiz'>('none');
  
  // Flashcard carousel state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Get active note model
  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  // Set default selected note on load if available
  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(notes[0].id);
    }
  }, [notes, selectedNoteId]);

  // Handle Note Creation
  const handleCreateNote = async () => {
    const defaultTitle = `Lecture Draft ${notes.length + 1}`;
    await addNote({
      title: defaultTitle,
      content: `# ${defaultTitle}\n\nDraft class notes here...`,
      isPinned: false,
      tags: [],
      subjectId: filterSubject || null,
      flashcards: []
    });
    
    // Select newly created note
    if (notes.length > 0) {
      setSelectedNoteId(notes[0].id);
    }
  };

  // Debounced updating actions for note textfields
  const handleContentChange = (content: string) => {
    if (!selectedNoteId) return;
    updateNote(selectedNoteId, { content, updatedAt: new Date().toISOString() });
  };

  const handleTitleChange = (title: string) => {
    if (!selectedNoteId) return;
    updateNote(selectedNoteId, { title, updatedAt: new Date().toISOString() });
  };

  const handleSubjectChange = (subjectId: string) => {
    if (!selectedNoteId) return;
    updateNote(selectedNoteId, { subjectId: subjectId || null });
  };

  const handleTogglePin = () => {
    if (!selectedNote) return;
    updateNote(selectedNote.id, { isPinned: !selectedNote.isPinned });
  };

  const handleDeleteNote = async () => {
    if (!selectedNoteId) return;
    await deleteNote(selectedNoteId);
    setSelectedNoteId(null);
    setActivePanel('none');
    setIsDeleteConfirmOpen(false);
  };

  // Add tag
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim() && selectedNote) {
      const trimmed = newTagInput.trim().toLowerCase();
      if (!selectedNote.tags.includes(trimmed)) {
        updateNote(selectedNote.id, { tags: [...selectedNote.tags, trimmed] });
      }
      setNewTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    if (!selectedNote) return;
    updateNote(selectedNote.id, { tags: selectedNote.tags.filter((t) => t !== tag) });
  };

  // Trigger simulated AI Summary
  const handleSummarize = async () => {
    if (!selectedNoteId) return;
    setIsAiLoading(true);
    setActivePanel('summary');
    await summarizeNote(selectedNoteId);
    setIsAiLoading(false);
  };

  // Trigger simulated AI Flashcards Quiz
  const handleGenerateQuiz = async () => {
    if (!selectedNoteId) return;
    setIsAiLoading(true);
    setActivePanel('quiz');
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setQuizScore({ correct: 0, total: 0 });
    await generateQuizFromNote(selectedNoteId);
    setIsAiLoading(false);
  };

  // Flashcard carousel actions
  const handleQuizAnswer = (wasCorrect: boolean) => {
    if (!selectedNote?.flashcards) return;
    setQuizScore((prev) => ({
      correct: prev.correct + (wasCorrect ? 1 : 0),
      total: prev.total + 1
    }));
    setIsFlipped(false);
    
    if (currentCardIndex < selectedNote.flashcards.length - 1) {
      setTimeout(() => {
        setCurrentCardIndex((c) => c + 1);
      }, 200);
    }
  };

  // Filter notes based on search & courses select
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject ? n.subjectId === filterSubject : true;
    return matchesSearch && matchesSubject;
  });

  // Sort notes: pinned at the top, then updated timestamp
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6 animate-fade-in max-w-7xl mx-auto text-left relative overflow-hidden">
      
      {/* 1. Left Navigation Folder Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden h-full shadow-sm">
        {/* Search & Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-sans font-black text-foreground text-sm tracking-wide uppercase flex items-center gap-1.5">
              <FolderOpen size={16} className="text-brand-600 dark:text-brand-400" /> Notes Directory
            </h4>
            <span className="text-[10px] text-muted-foreground font-bold bg-muted border border-border px-1.5 py-0.5 rounded-full">
              {filteredNotes.length} Notes
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search concepts or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
            />
          </div>

          <Select
            value={filterSubject}
            onChange={(val) => setFilterSubject(val)}
            options={[
              { value: '', label: '-- All Subjects / General --' },
              ...subjects.map((sub) => ({
                value: sub.id,
                label: `${sub.name} (${sub.code || ''})`
              }))
            ]}
          />
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sortedNotes.map((note) => {
            const subject = subjects.find((s) => s.id === note.subjectId);
            const isSelected = note.id === selectedNoteId;
            const plainTextSnippet = note.content
              .replace(/[#*`\-]/g, '')
              .substring(0, 70);

            return (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNoteId(note.id);
                  setActivePanel('none');
                }}
                className={`
                  p-3 rounded-lg border text-left cursor-pointer transition-all duration-200 relative group
                  ${isSelected
                    ? 'bg-brand-500/10 border-brand-500/30 shadow-glow-brand'
                    : 'bg-muted/10 border-border hover:bg-muted/40'}
                `}
              >
                {/* Highlight Course Color Bar */}
                {subject && (
                  <div
                    className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md"
                    style={{ backgroundColor: subject.color }}
                  />
                )}

                <div className="space-y-2 pl-2">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-xs font-black text-foreground group-hover:text-brand-500 transition-colors truncate w-4/5">
                      {note.title}
                    </h5>
                    {note.isPinned && <Pin size={10} className="text-brand-650 dark:text-brand-400 mt-0.5" />}
                  </div>

                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {plainTextSnippet || 'Empty workspace...'}
                  </p>

                  <div className="flex flex-wrap gap-1 items-center">
                    {subject && (
                      <span
                        className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border"
                        style={{
                          backgroundColor: `${subject.color}15`,
                          borderColor: `${subject.color}30`,
                          color: subject.color
                        }}
                      >
                        {subject.code}
                      </span>
                    )}
                    {note.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[8px] font-bold text-muted-foreground bg-muted border border-border px-1 py-0.5 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {sortedNotes.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground font-bold">
              No files found. Click below to add!
            </div>
          )}
        </div>

        {/* Bottom Create Button */}
        <div className="p-3 border-t border-border bg-muted/40">
          <Button onClick={handleCreateNote} className="w-full gap-1.5 font-bold h-9 text-xs">
            <Plus size={14} /> Draft New Note
          </Button>
        </div>
      </div>

      {/* 2. Main Workspace Editor/Previewer Panel */}
      <div className="flex-1 flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {selectedNote ? (
          <div className="flex flex-col h-full overflow-hidden">
            
            {/* Top Workspace Header Bar */}
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-3/5">
                {/* Pin note button */}
                <button
                  onClick={handleTogglePin}
                  className={`p-1.5 rounded-lg border transition-all ${selectedNote.isPinned ? 'bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-brand-400 shadow-glow-brand' : 'bg-muted border-border text-muted-foreground hover:text-foreground'}`}
                  title={selectedNote.isPinned ? 'Unpin File' : 'Pin File'}
                >
                  {selectedNote.isPinned ? <Pin size={14} /> : <PinOff size={14} />}
                </button>

                {/* Real-time title edit */}
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-transparent border-none font-sans font-black text-foreground text-lg focus:outline-none placeholder:text-muted-foreground/60"
                  placeholder="Note Title"
                />
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={selectedNote.subjectId || ''}
                  onChange={(val) => handleSubjectChange(val)}
                  options={[
                    { value: '', label: 'No Course Link' },
                    ...subjects.map((sub) => ({
                      value: sub.id,
                      label: sub.code || sub.name
                    }))
                  ]}
                  className="w-full sm:w-40"
                />

                <div className="flex border border-border bg-muted rounded-lg p-0.5">
                  {(['split', 'edit', 'preview'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-2 py-1 rounded text-[10px] font-bold capitalize transition-all ${viewMode === mode ? 'bg-brand-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 hover:bg-red-500/20 active:scale-95 transition-all"
                  title="Delete File"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Tags row */}
            <div className="px-4 py-2 border-b border-border bg-muted/10 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <Tag size={10} className="text-muted-foreground" /> Tags:
              </div>
              
              <div className="flex flex-wrap gap-1.5 items-center">
                {selectedNote.tags.map((tag) => (
                  <Badge key={tag} variant="slate" className="gap-1 pr-1 hover:border-red-500/30 transition-colors">
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="h-3.5 w-3.5 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-650 dark:hover:text-red-400 transition-colors"
                    >
                      <X size={8} />
                    </button>
                  </Badge>
                ))}

                <input
                  type="text"
                  placeholder="type + enter"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="bg-transparent border-none text-[10px] text-foreground focus:outline-none placeholder:text-muted-foreground/65"
                  style={{ width: '80px' }}
                />
              </div>
            </div>

            {/* Markdown Workspace Body split panels */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
              
              {/* EDIT MODE PANEL */}
              {(viewMode === 'edit' || viewMode === 'split') && (
                <div className={`flex flex-col border-b md:border-b-0 md:border-r border-border/80 ${viewMode === 'edit' ? 'w-full h-full' : 'w-full md:w-1/2 h-1/2 md:h-full'}`}>
                  <textarea
                    value={selectedNote.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full flex-1 bg-card text-foreground font-mono text-xs leading-relaxed p-4 sm:p-6 focus:outline-none resize-none placeholder:text-muted-foreground/60 overflow-y-auto"
                    placeholder="# Cache Architecture Notes&#10;&#10;## Direct Mapped Cache&#10;- Index = (Block Address) mod (Cache Lines)..."
                  />
                </div>
              )}

              {/* PREVIEW MODE PANEL */}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className={`overflow-y-auto p-4 sm:p-6 bg-muted/10 text-left ${viewMode === 'preview' ? 'w-full h-full' : 'w-full md:w-1/2 h-1/2 md:h-full'}`}>
                  <div className="prose prose-invert max-w-none space-y-4">
                    {renderMarkdown(selectedNote.content)}
                  </div>
                </div>
              )}

              {/* Floating AI Panel Drawers triggers */}
              <div className="absolute bottom-6 right-6 flex items-center gap-3">
                <Button
                  onClick={handleSummarize}
                  isLoading={isAiLoading && activePanel === 'summary'}
                  variant="glass"
                  size="sm"
                  className="gap-1.5 font-bold h-9 border-brand-500/20 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10"
                >
                  <Sparkles size={13} /> AI Summary
                </Button>
                <Button
                  onClick={handleGenerateQuiz}
                  isLoading={isAiLoading && activePanel === 'quiz'}
                  variant="glass"
                  size="sm"
                  className="gap-1.5 font-bold h-9 border-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Brain size={13} /> AI Study Quiz
                </Button>
              </div>

            </div>

            {/* 3. Bottom Sliding Drawer: AI Panel */}
            <AnimatePresence>
              {activePanel !== 'none' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: '340px', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="border-t border-border bg-card p-6 relative overflow-hidden"
                >
                  {/* Close drawer */}
                  <button
                    onClick={() => setActivePanel('none')}
                    className="absolute right-6 top-6 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={16} />
                  </button>

                  {/* Summary content panel */}
                  {activePanel === 'summary' && (
                    <div className="space-y-4 h-full flex flex-col">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-brand-500/10 flex items-center justify-center border border-brand-500/20 text-brand-600 dark:text-brand-400">
                          <Sparkles size={14} />
                        </div>
                        <h4 className="font-sans font-black text-foreground text-sm tracking-wide uppercase">🤖 AI Core Concept Summary</h4>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-4 py-2 border border-border bg-muted/30 rounded-xl p-4 leading-relaxed text-left">
                        {isAiLoading ? (
                          <div className="flex flex-col items-center justify-center py-16 gap-3 text-xs text-muted-foreground font-semibold">
                            <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent animate-spin rounded-full" />
                            Synthesizing concept relationships...
                          </div>
                        ) : selectedNote.aiSummary ? (
                          <div className="prose prose-invert text-xs space-y-2">
                            {renderMarkdown(selectedNote.aiSummary)}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No summary generated. Click "AI Summary" to synthesize note drafts.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quiz Carousel Panel */}
                  {activePanel === 'quiz' && (
                    <div className="space-y-4 h-full flex flex-col">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                            <Brain size={14} />
                          </div>
                          <h4 className="font-sans font-black text-foreground text-sm tracking-wide uppercase">📝 AI Concept Study Cards</h4>
                        </div>
                        {selectedNote.flashcards && selectedNote.flashcards.length > 0 && (
                          <span className="text-[10px] font-bold text-cyan-650 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                            Score: {quizScore.correct}/{quizScore.total} answered
                          </span>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col items-center justify-center py-2">
                        {isAiLoading ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-3 text-xs text-muted-foreground font-semibold">
                            <div className="h-6 w-6 border-2 border-cyan-500 border-t-transparent animate-spin rounded-full" />
                            Drafting recall questionnaire...
                          </div>
                        ) : selectedNote.flashcards && selectedNote.flashcards.length > 0 ? (
                          <div className="w-full max-w-lg flex flex-col items-center gap-4">
                            
                            {/* Visual card container */}
                            <div
                              onClick={() => setIsFlipped(!isFlipped)}
                              className="w-full h-32 bg-muted border border-border hover:border-cyan-500/30 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none transition-all relative overflow-hidden group shadow-sm"
                            >
                              <div className="absolute right-3 top-3 text-[8px] text-muted-foreground/60 font-bold uppercase tracking-wider group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                click to flip card
                              </div>

                              <AnimatePresence mode="wait">
                                {!isFlipped ? (
                                  <motion.div
                                    key="question"
                                    initial={{ opacity: 0, rotateY: -90 }}
                                    animate={{ opacity: 1, rotateY: 0 }}
                                    exit={{ opacity: 0, rotateY: 90 }}
                                    className="space-y-1.5"
                                  >
                                    <span className="text-[9px] font-bold text-cyan-650 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">Q: Card {currentCardIndex + 1}/{selectedNote.flashcards.length}</span>
                                    <p className="text-sm font-extrabold text-foreground">{selectedNote.flashcards[currentCardIndex].question}</p>
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="answer"
                                    initial={{ opacity: 0, rotateY: 90 }}
                                    animate={{ opacity: 1, rotateY: 0 }}
                                    exit={{ opacity: 0, rotateY: -90 }}
                                    className="space-y-1.5"
                                  >
                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Answer Matrix</span>
                                    <p className="text-xs text-foreground font-semibold leading-normal">{selectedNote.flashcards[currentCardIndex].answer}</p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Buttons correct/incorrect */}
                            <div className="flex items-center gap-4">
                              <Button
                                onClick={() => handleQuizAnswer(false)}
                                variant="glass"
                                size="sm"
                                className="!rounded-full text-rose-600 dark:text-rose-455 border-rose-500/20 hover:bg-rose-500/10 font-bold text-xs"
                              >
                                <X size={12} className="mr-1" /> Incorrect
                              </Button>
                              <Button
                                onClick={() => handleQuizAnswer(true)}
                                variant="glass"
                                size="sm"
                                className="!rounded-full text-emerald-600 dark:text-emerald-450 border-emerald-500/20 hover:bg-emerald-500/10 font-bold text-xs"
                              >
                                <Check size={12} className="mr-1" /> Correct
                              </Button>
                            </div>

                          </div>
                        ) : (
                          <div className="py-6 text-center text-xs text-muted-foreground font-medium">
                            No study study cards created for this file yet. Tap "AI Study Quiz" to compile flashcards automatically.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10 border border-dashed border-border rounded-xl">
            <BookOpen size={48} className="text-muted-foreground mb-4 animate-float" />
            <h4 className="text-foreground text-base font-extrabold">Active File Empty</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mb-6">
              Create a note workspace or select a lecture note folder to edit, preview Markdown, and compile AI summaries.
            </p>
            <Button onClick={handleCreateNote} size="sm" className="gap-1.5 font-bold">
              <Plus size={14} /> Draft First Note
            </Button>
          </div>
        )}
      </div>

      {/* Custom Destructive Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete Note permanently?"
        size="sm"
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
            Are you sure you want to permanently delete this note? This action cannot be undone and will permanently wipe the content from your database.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" onClick={() => setIsDeleteConfirmOpen(false)} variant="ghost" size="sm">
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleDeleteNote} 
              variant="primary" 
              size="sm" 
              className="bg-red-650 dark:bg-red-500 text-white hover:bg-red-750 dark:hover:bg-red-650 border-transparent shadow-md shadow-red-500/10 font-bold"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
