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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neu-base/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-neu-base rounded-3xl shadow-neu-flat w-full max-w-md m-auto border border-white/40">
        <div className="flex justify-between items-center p-6 pb-2">
          <h2 className="text-xl font-bold text-neu-text tracking-wide">
            {initialTask ? 'Edit Task' : 'New Task'}
          </h2>
          <button 
            type="button"
            onClick={onCancel}
            className="w-10 h-10 rounded-full bg-neu-base shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed flex items-center justify-center text-gray-500 hover:text-neu-accent transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4">
          <div>
            <label className="block text-xs font-bold text-neu-text/70 mb-2 ml-1 uppercase tracking-wider">Title <span className="text-red-400">*</span></label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-neu-base shadow-neu-pressed text-neu-text focus:text-neu-accent outline-none transition-all placeholder:text-gray-400 font-medium text-sm"
              placeholder="E.g., Complete project proposal"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neu-text/70 mb-2 ml-1 uppercase tracking-wider">Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-2xl bg-neu-base shadow-neu-pressed text-neu-text focus:text-neu-accent outline-none transition-all placeholder:text-gray-400 resize-none font-medium text-sm"
              placeholder="Add details about this task..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neu-text/70 mb-2 ml-1 uppercase tracking-wider">Due Date <span className="text-red-400">*</span></label>
              <input 
                type="date" 
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-neu-base shadow-neu-pressed text-neu-text focus:text-neu-accent outline-none transition-all font-medium text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neu-text/70 mb-2 ml-1 uppercase tracking-wider">Priority</label>
              <select 
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-4 py-3 rounded-2xl bg-neu-base shadow-neu-pressed text-neu-text focus:text-neu-accent outline-none transition-all appearance-none cursor-pointer font-medium text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neu-text/70 mb-2 ml-1 uppercase tracking-wider">Categories (Press Enter)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {categories.map(cat => (
                <span key={cat} className="px-3 py-1.5 bg-neu-base shadow-neu-flat text-neu-accent rounded-full text-xs font-bold flex items-center gap-2">
                  {cat}
                  <button type="button" onClick={() => removeCategory(cat)} className="hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <input 
              type="text" 
              value={categoryInput}
              onChange={e => setCategoryInput(e.target.value)}
              onKeyDown={handleAddCategory}
              className="w-full px-4 py-3 rounded-2xl bg-neu-base shadow-neu-pressed text-neu-text focus:text-neu-accent outline-none transition-all placeholder:text-gray-400 font-medium text-sm"
              placeholder="E.g., Work, Personal"
            />
          </div>

          <div className="pt-6 flex gap-4 justify-end">
            <button 
              type="button" 
              onClick={onCancel}
              className="px-6 py-3 font-bold text-sm text-gray-500 rounded-2xl bg-neu-base shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed transition-all duration-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-3 font-bold text-sm text-neu-accent rounded-2xl bg-neu-base shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed transition-all duration-200"
            >
              {initialTask ? 'Save Changes' : 'Create Task'}
 