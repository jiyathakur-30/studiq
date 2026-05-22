import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  ClipboardList,
  Search,
  Filter,
  CheckCircle,
  Calendar,
  AlertCircle,
  User,
  PlusCircle,
  X,
  Trash2
} from 'lucide-react';
import { useAppStore } from '../context/store';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';

type StatusType = 'todo' | 'in_progress' | 'review' | 'done';

export const Assignments: React.FC = () => {
  const { assignments, subjects, addAssignment, updateAssignment, deleteAssignment } = useAppStore();
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals & Inspector State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Drag over tracking
  const [activeDragColumn, setActiveDragColumn] = useState<string | null>(null);

  // Form State (Create Task)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [subjectId, setSubjectId] = useState('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;
    
    await addAssignment({
      title,
      description,
      dueDate: new Date(dueDate).toISOString(),
      priority,
      status: 'todo',
      subjectId: subjectId || null,
      subtasks: []
    });

    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('medium');
    setSubjectId('');
    setIsAddOpen(false);
  };

  // --- HTML5 Native Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: StatusType) => {
    e.preventDefault();
    setActiveDragColumn(status);
  };

  const handleDragLeave = () => {
    setActiveDragColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: StatusType) => {
    e.preventDefault();
    setActiveDragColumn(null);
    const id = e.dataTransfer.getData('taskId');
    if (id) {
      await updateAssignment(id, { status: targetStatus });
    }
  };

  // Subtask Toggling inside inspector
  const handleToggleSubtask = async (subtaskId: string) => {
    if (!selectedTask) return;
    
    const updatedSubtasks = selectedTask.subtasks.map((st: any) =>
      st._id === subtaskId || st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );

    const updatedTask = await updateAppTask(selectedTask.id || selectedTask._id, { subtasks: updatedSubtasks });
    if (updatedTask) setSelectedTask(updatedTask);
  };

  const handleAddSubtask = async (subtaskTitle: string) => {
    if (!selectedTask || !subtaskTitle.trim()) return;
    
    const newSub = {
      id: 'subt-' + Date.now(),
      title: subtaskTitle,
      isCompleted: false
    };

    const updatedSubtasks = [...(selectedTask.subtasks || []), newSub];
    const updatedTask = await updateAppTask(selectedTask.id || selectedTask._id, { subtasks: updatedSubtasks });
    if (updatedTask) setSelectedTask(updatedTask);
  };

  const updateAppTask = async (id: string, updates: any) => {
    await updateAssignment(id, updates);
    // Find updated version
    const active = useAppStore.getState().assignments.find(a => a.id === id || (a as any)._id === id);
    return active;
  };

  const handleDeleteTask = async (id: string) => {
    await deleteAssignment(id);
    setIsInspectorOpen(false);
    setSelectedTask(null);
  };

  // Filter Tasks
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || 
                          a.description.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter ? a.subjectId === subjectFilter || (a.subjectId as any)?._id === subjectFilter : true;
    const matchesPriority = priorityFilter ? a.priority === priorityFilter : true;
    return matchesSearch && matchesSubject && matchesPriority;
  });

  const columns: { status: StatusType; label: string; color: string }[] = [
    { status: 'todo', label: 'Backlog / Todo', color: 'bg-muted border-border' },
    { status: 'in_progress', label: 'In Progress', color: 'bg-brand-500/10 border-brand-500/20' },
    { status: 'review', label: 'Peer Review', color: 'bg-amber-500/10 border-amber-500/20' },
    { status: 'done', label: 'Completed', color: 'bg-emerald-500/10 border-emerald-500/20' }
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-black text-2xl text-foreground tracking-tight">
            Assignments Kanban
          </h2>
          <p className="text-sm text-muted-foreground">
            Linear-style agile workflows to coordinate your assignment milestones.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} variant="primary" size="sm" className="gap-1.5 font-bold h-9">
          <Plus size={14} /> Add New Task
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card backdrop-blur-md border border-border p-4 rounded-xl shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3.5 top-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
          />
        </div>

        {/* Subject Filter */}
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="w-full sm:w-44 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/50"
        >
          <option value="">Filter by Course</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-full sm:w-44 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/50"
        >
          <option value="">Filter by Priority</option>
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((col) => {
          const colTasks = filteredAssignments.filter(t => t.status === col.status);
          const isOver = activeDragColumn === col.status;

          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`
                kanban-column rounded-2xl flex flex-col gap-4 p-4 min-h-[60vh] transition-all duration-350 border
                ${isOver ? 'bg-brand-500/5 border-brand-500/30 border-dashed shadow-[0_0_20px_rgba(99,102,241,0.05)]' : 'bg-muted/20 border-border/80'}
              `}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold text-foreground flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.status === 'done' ? 'bg-emerald-500' : col.status === 'review' ? 'bg-amber-500' : col.status === 'in_progress' ? 'bg-brand-500' : 'bg-muted-foreground/60'}`} />
                  {col.label}
                </span>
                <Badge variant="slate" className="font-bold">{colTasks.length}</Badge>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-0.5">
                {colTasks.map((task) => {
                  const sub = subjects.find(s => s.id === task.subjectId || (s as any)._id === task.subjectId);
                  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';
                  const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;
                  const totalSubtasks = task.subtasks?.length || 0;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => {
                        setSelectedTask(task);
                        setIsInspectorOpen(true);
                      }}
                      className="p-4 rounded-xl bg-card border border-border hover:border-brand-500/40 cursor-grab active:cursor-grabbing hover:shadow-glow-brand hover:-translate-y-0.5 transition-all duration-200 text-left space-y-3.5 relative overflow-hidden group shadow-sm"
                    >
                      {/* Priority Tag indicator line */}
                      <div className={`absolute top-0 left-0 bottom-0 w-0.5 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />

                      <div className="space-y-1.5 pl-1.5">
                        {sub && (
                          <span className="text-[9px] font-black uppercase tracking-wider block" style={{ color: sub.color }}>
                            {sub.code || sub.name}
                          </span>
                        )}
                        <h4 className="text-xs font-black text-foreground leading-snug group-hover:text-brand-500 transition-colors truncate">
                          {task.title}
                        </h4>
                      </div>

                      {/* Info Metadata */}
                      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground pl-1.5">
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-650 dark:text-red-400 font-extrabold' : ''}`}>
                          <Calendar size={11} /> {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                        
                        {totalSubtasks > 0 && (
                          <span className="bg-muted px-1.5 py-0.5 rounded border border-border">
                            {completedSubtasks}/{totalSubtasks} Checklist
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="py-12 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground text-xs font-semibold">
                    Empty Column
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal: Create Task */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Assignment Task"
        size="sm"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Assignment / Task Title"
            placeholder="e.g. Design 8-Bit CPU logic pathways"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label="Optional Description"
            placeholder="e.g. wire instruction registers and log rotate sequences"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Select Subject Mapping</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="">-- No Subject (General Task) --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" onClick={() => setIsAddOpen(false)} variant="ghost" size="sm">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Card
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Task Inspector / Detailed Drawer */}
      <Modal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        title="Task Detailed Inspector"
        size="md"
      >
        {selectedTask ? (
          <div className="space-y-6 text-left">
            <div className="space-y-1.5 pb-4 border-b border-border">
              <span className="text-[10px] font-black uppercase text-brand-600 dark:text-brand-400 block tracking-wider">
                {selectedTask.priority.toUpperCase()} PRIORITY CARD
              </span>
              <h3 className="font-sans font-black text-xl text-foreground leading-snug">
                {selectedTask.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-2 italic bg-muted p-3 rounded-lg border border-border">
                {selectedTask.description || 'No description provided for this card.'}
              </p>
            </div>

            {/* Checklist subtasks segments */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider block">Checklist Subtasks</h4>
              
              <div className="space-y-2">
                {selectedTask.subtasks?.map((st: any) => (
                  <button
                    key={st.id || st._id}
                    onClick={() => handleToggleSubtask(st.id || st._id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all text-left text-xs font-semibold text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={st.isCompleted}
                      readOnly
                      className="rounded accent-brand-500 pointer-events-none"
                    />
                    <span className={st.isCompleted ? 'line-through text-muted-foreground' : ''}>
                      {st.title}
                    </span>
                  </button>
                ))}

                {/* Quick Add Subtask */}
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    id="new-subtask-input"
                    placeholder="Add checklist item..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSubtask((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    className="flex-1 bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                  />
                  <Button
                    onClick={() => {
                      const input = document.getElementById('new-subtask-input') as HTMLInputElement;
                      if (input) {
                        handleAddSubtask(input.value);
                        input.value = '';
                      }
                    }}
                    variant="secondary"
                    size="sm"
                    className="!py-1 text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Danger Zone deletion cascading */}
            <div className="flex items-center justify-between border-t border-border pt-5 mt-6">
              <span className="text-[10px] text-muted-foreground font-semibold">
                Created: {new Date(selectedTask.createdAt || Date.now()).toLocaleDateString()}
              </span>
              
              <Button
                onClick={() => handleDeleteTask(selectedTask.id || selectedTask._id)}
                variant="danger"
                size="sm"
                className="gap-1 text-xs"
              >
                <Trash2 size={13} /> Delete Card
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

    </div>
  );
};
