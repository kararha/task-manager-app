"use client";

import React from 'react';
import { Task } from '../types';
import { Calendar, Tag, AlertCircle, CheckCircle2, Circle, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
    <div className={`group relative p-6 rounded-[32px] bg-neu-base transition-all duration-300 ${
      task.completed ? 'shadow-neu-pressed opacity-70' : 'shadow-neu-flat'
    }`}>
      
      <div className="flex items-start gap-5">
        <button 
          onClick={handleToggle}
          className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
            task.completed 
              ? 'shadow-neu-pressed text-neu-accent' 
              : 'shadow-neu-flat hover:shadow-neu-sm text-gray-400 hover:text-neu-accent active:shadow-neu-pressed'
          }`}
          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-3">
            <h3 className={`text-xl font-bold truncate pr-4 mt-2 ${task.completed ? 'line-through text-gray-400' : 'text-neu-text'}`}>
              {task.title}
            </h3>
            
            <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-2">
              <button 
                onClick={() => onEdit(task)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-neu-base shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed flex items-center justify-center text-gray-500 hover:text-neu-accent transition-all"
                aria-label="Edit task"
              >
                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button 
                onClick={() => {
                  toast((t) => (
                    <div className="flex flex-col gap-3">
                      <span className="font-bold text-neu-text text-sm">Delete this task?</span>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => { 
                            toast.dismiss(t.id); 
                            onDelete(task.id); 
                            toast.success('Task deleted', { 
                              iconTheme: { primary: '#ef4444', secondary: '#E0E5EC' },
                            }); 
                          }}
                          className="px-4 py-2 bg-neu-base shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed rounded-xl text-red-500 text-xs font-bold transition-all"
                        >
                          Yes, delete
                        </button>
                        <button 
                          onClick={() => toast.dismiss(t.id)}
                          className="px-4 py-2 bg-neu-base shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed rounded-xl text-gray-500 text-xs font-bold transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ), { duration: 5000 });
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-neu-base shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed flex items-center justify-center text-gray-500 hover:text-red-500 transition-all"
                aria-label="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed font-medium">
            {task.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500">
            <div className={`flex items-center gap-1.5 ${
              task.priority === 'High' ? 'text-red-500' : 
              task.priority === 'Medium' ? 'text-orange-500' : 'text-neu-accent'
            }`}>
              <AlertCircle className="w-4 h-4" />
              {task.priority}
            </div>

            <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-500' : ''}`}>
              <Calendar className="w-4 h-4" />
              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            {task.categories.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                <div className="flex gap-2">
                  {task.categories.map(cat => (
                    <span key={cat} className="px-3 py-1.5 bg-neu-base shadow-neu-pressed rounded-full text-neu-accent">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
