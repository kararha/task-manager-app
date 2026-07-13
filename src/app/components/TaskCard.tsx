"use client";

import React from 'react';
import { Task } from '../types';
import { CheckCircle2, Circle, Edit2, Trash2, Calendar, AlertCircle, Tag } from 'lucide-react';
import { TiltCard } from './SpecialEffects';
import { BentoCard } from './BentoGrid';
import { cn } from '../utils';
import toast from 'react-hot-toast';

const getCategoryTone = (category: string): "success" | "warning" | "info" | "danger" | "neutral" => {
  const normalized = category.toLowerCase().trim();
  if (['work', 'job', 'office', 'dev', 'coding', 'project'].some(k => normalized.includes(k))) {
    return 'info';
  }
  if (['personal', 'life', 'health', 'fitness', 'home'].some(k => normalized.includes(k))) {
    return 'success';
  }
  if (['urgent', 'priority', 'high', 'asap', 'alert', 'critical', 'due'].some(k => normalized.includes(k))) {
    return 'danger';
  }
  if (['idea', 'creative', 'design', 'learn', 'study', 'read'].some(k => normalized.includes(k))) {
    return 'warning';
  }
  return 'neutral';
};

const getCardAccent = (priority: string, completed: boolean): string => {
  if (completed) return 'neutral';
  if (priority === 'High') return 'danger';
  if (priority === 'Medium') return 'warning';
  return 'info';
};

const BackgroundGlow = ({ priority, completed }: { priority: string; completed: boolean }) => {
  if (completed) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl bg-emerald-500/10" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full blur-3xl bg-slate-500/10" />
      </div>
    );
  }
  
  const glowColors: Record<string, string> = {
    High: "from-rose-500/10 to-pink-500/5",
    Medium: "from-amber-500/10 to-yellow-500/5",
    Low: "from-blue-500/10 to-indigo-500/5",
  };

  const glowClass = glowColors[priority] || "from-blue-500/10 to-indigo-500/5";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-500">
      <div className={`absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl bg-gradient-to-br ${glowClass}`} />
      <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full blur-3xl bg-purple-500/5" />
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export default function TaskCard({ task, onUpdate, onDelete, onEdit }: TaskCardProps) {
  const isOverdue = !task.completed && new Date(task.dueDate) < new Date();

  const handleToggle = () => {
    onUpdate({ ...task, completed: !task.completed });
  };

  return (
    <TiltCard className="h-full">
      <BentoCard
        className={cn(
          "card card-accent h-full p-0 flex flex-col justify-between select-none cursor-grab active:cursor-grabbing",
          task.completed ? "opacity-70" : ""
        )}
        data-accent={getCardAccent(task.priority, task.completed)}
        background={<BackgroundGlow priority={task.priority} completed={task.completed} />}
      >
        <div className="p-6 flex flex-col justify-between h-full relative z-10">
          <div className="flex items-start gap-4">
            <label className="check mt-1 flex-shrink-0">
              <input 
                type="checkbox"
                checked={task.completed}
                onChange={handleToggle}
                aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
              />
            </label>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-2">
                <h3 className={cn(
                  "t-title-md truncate pr-4 leading-snug",
                  task.completed ? 'line-through t-muted' : 't-primary'
                )}>
                  {task.title}
                </h3>
                
                <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 transform sm:translate-y-2 sm:group-hover:translate-y-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                    className="btn btn-secondary btn-icon btn-sm"
                    aria-label="Edit task"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toast((t) => (
                        <div className="flex flex-col gap-3">
                          <span className="font-bold text-[var(--color-text-primary)] text-sm">Delete this task?</span>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => { 
                                toast.dismiss(t.id); 
                                onDelete(task.id); 
                                toast.success('Task deleted', { 
                                  iconTheme: { primary: '#FF3A5C', secondary: '#0A0B0F' },
                                }); 
                              }}
                              className="btn btn-danger btn-sm"
                            >
                              Yes, delete
                            </button>
                            <button 
                              onClick={() => toast.dismiss(t.id)}
                              className="btn btn-secondary btn-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ), { duration: 5000 });
                    }}
                    className="btn btn-danger btn-icon btn-sm"
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="t-body-sm line-clamp-2 leading-relaxed mb-4">
                {task.description}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <span className="chip" data-tone={task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'info'}>
                  <AlertCircle className="w-3 h-3" />
                  {task.priority}
                </span>

                <span className={cn("chip", isOverdue ? "border-[var(--color-danger)] text-[var(--color-danger)] bg-[var(--color-danger-soft)]" : "")} data-tone="neutral">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </span>

                {task.categories.map(cat => (
                  <span key={cat} className="chip" data-tone={getCategoryTone(cat)}>
                    <Tag className="w-3 h-3" />
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </BentoCard>
    </TiltCard>
  );
}
