"use client";

import React, { useState, useEffect } from 'react';
import { Task, Priority } from '../types';
import { X } from 'lucide-react';

interface TaskFormProps {
  initialTask?: Task | null;
  onSave: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export default function TaskForm({ initialTask, onSave, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [categoryInput, setCategoryInput] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description);
      setDueDate(initialTask.dueDate.split('T')[0]);
      setPriority(initialTask.priority);
      setCategories(initialTask.categories);
    } else {
      setDueDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialTask]);

  const handleAddCategory = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && categoryInput.trim()) {
      e.preventDefault();
      if (!categories.includes(categoryInput.trim())) {
        setCategories([...categories, categoryInput.trim()]);
      }
      setCategoryInput('');
    }
  };

  const removeCategory = (catToRemove: string) => {
    setCategories(categories.filter(c => c !== catToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      dueDate: new Date(dueDate).toISOString(),
      priority,
      categories,
      completed: initialTask ? initialTask.completed : false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[var(--color-overlay)] backdrop-blur-md overflow-y-auto">
      <div className="surface-elevated w-full max-w-md m-auto">
        <div className="flex justify-between items-center p-6 pb-2">
          <h2 className="t-title-md">
            {initialTask ? 'Edit Task' : 'New Task'}
          </h2>
          <button 
            type="button"
            onClick={onCancel}
            className="btn btn-secondary btn-icon btn-sm"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-3 stack-md">
          <div className="field">
            <label className="field-label">Title <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input"
              placeholder="E.g., Complete project proposal"
            />
          </div>

          <div className="field">
            <label className="field-label">Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="textarea"
              placeholder="Add details about this task..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="field-label">Due Date <span className="text-red-400">*</span></label>
              <input 
                type="date" 
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="input"
              />
            </div>
            <div className="field">
              <label className="field-label">Priority</label>
              <div className="tabs w-full">
                {(['Low', 'Medium', 'High'] as Priority[]).map((p) => {
                  const isActive = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`tab flex-1 ${isActive ? 'is-active' : ''}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="field">
            <label className="field-label">Categories</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {categories.map(cat => (
                <span key={cat} className="chip animate-fade-in" data-tone="info">
                  {cat}
                  <button type="button" onClick={() => removeCategory(cat)} className="hover:text-red-500 transition-colors ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <input 
              type="text" 
              value={categoryInput}
              onChange={e => setCategoryInput(e.target.value)}
              onKeyDown={handleAddCategory}
              className="input"
              placeholder="Press Enter to add tags"
            />
          </div>

          <div className="pt-6 flex gap-3 justify-end">
            <button 
              type="button" 
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              {initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
