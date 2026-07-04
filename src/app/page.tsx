"use client";

import React, { useState, useMemo } from 'react';
import { Task, FilterStatus, SortOption } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import TaskCard from './components/TaskCard';
import TaskForm from './components/TaskForm';
import DashboardStats from './components/DashboardStats';
import { Plus, Search, SlidersHorizontal, LayoutDashboard, Moon, Sun, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function TaskManager() {
  const [tasks, setTasks, isHydrated] = useLocalStorage<Task[]>('tasks', []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('darkMode', false);
  
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [sortOption, setSortOption] = useState<SortOption>('manual');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    safeTasks.forEach(t => {
      if (Array.isArray(t?.categories)) {
        t.categories.forEach(c => cats.add(c));
      }
    });
    return Array.from(cats).sort();
  }, [safeTasks]);

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...safeTasks];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(t => 
        t?.title?.toLowerCase().includes(lowerQuery) || 
        t?.description?.toLowerCase().includes(lowerQuery)
      );
    }

    if (statusFilter === 'Active') {
      result = result.filter(t => !t?.completed);
    } else if (statusFilter === 'Completed') {
      result = result.filter(t => t?.completed);
    }

    if (priorityFilter !== 'All') {
      result = result.filter(t => t?.priority === priorityFilter);
    }

    if (categoryFilter !== 'All') {
      result = result.filter(t => Array.isArray(t?.categories) && t.categories.includes(categoryFilter));
    }

    if (sortOption !== 'manual') {
      result.sort((a, b) => {
        const priorityWeights: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
        
        const getPriority = (p: any) => priorityWeights[p] || 0;
        const getTime = (d: any) => d ? new Date(d).getTime() : 0;

        switch (sortOption) {
          case 'dueDateAsc':
            return getTime(a.dueDate) - getTime(b.dueDate);
          case 'dueDateDesc':
            return getTime(b.dueDate) - getTime(a.dueDate);
          case 'priorityDesc':
            return getPriority(b.priority) - getPriority(a.priority);
          case 'priorityAsc':
            return getPriority(a.priority) - getPriority(b.priority);
          default:
            return 0;
        }
      });
    }

    return result;
  }, [safeTasks, searchQuery, statusFilter, priorityFilter, categoryFilter, sortOption]);

  const handleReorder = (newOrder: Task[]) => {
    // If not in manual sort, prevent dragging logic or force switch to manual
    if (sortOption !== 'manual') {
      setSortOption('manual');
      toast('Switched to manual sort mode', { icon: '🖐️' });
    }
    
    // Create a new tasks array preserving the elements that are hidden by filters
    const visibleIds = new Set(newOrder.map(t => t.id));
    const hiddenTasks = safeTasks.filter(t => !visibleIds.has(t.id));
    setTasks([...newOrder, ...hiddenTasks]);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...taskData, id: t.id, createdAt: t.createdAt } : t));
    } else {
      const newTask: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setTasks([...tasks, newTask]);
    }
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const exportTasks = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'taskmaster-backup.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Tasks exported successfully!', { iconTheme: { primary: '#4299E1', secondary: '#E0E5EC' }});
  };

  const importTasks = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedData)) {
          setTasks(importedData);
          toast.success('Tasks imported successfully!', { iconTheme: { primary: '#4299E1', secondary: '#E0E5EC' }});
        } else {
          toast.error('Invalid backup file format.');
        }
      } catch (err) {
        toast.error('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-[#E0E5EC] shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#4299E1] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neu-base text-neu-text font-sans pb-12 pt-6 sm:pb-16 sm:pt-10 selection:bg-neu-accent selection:text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-16 gap-6 sm:gap-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-neu-base shadow-neu-flat flex items-center justify-center text-neu-accent">
            <LayoutDashboard className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-br from-gray-600 to-gray-800 flex-1 text-center sm:text-left drop-shadow-sm">
            TaskMaster
          </h1>
          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-3 sm:gap-4">
            <input 
              type="file" 
              accept=".json" 
              id="import-backup" 
              className="hidden" 
              onChange={importTasks} 
            />
            <label 
              htmlFor="import-backup"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neu-base shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed flex items-center justify-center text-gray-500 hover:text-neu-accent transition-all duration-200 cursor-pointer"
              title="Import Backup"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            </label>
            <button 
              onClick={exportTasks}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neu-base shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed flex items-center justify-center text-gray-500 hover:text-neu-accent transition-all duration-200"
              title="Export Backup"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neu-base shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed flex items-center justify-center text-neu-accent transition-all duration-200"
              aria-label="Toggle Dark Mode"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button 
              onClick={() => { setEditingTask(null); setIsFormOpen(true); }}
              className="flex items-center gap-2 sm:gap-3 bg-neu-base shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed text-neu-accent px-5 py-3 sm:px-8 sm:py-4 rounded-2xl font-extrabold transition-all duration-200"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="uppercase tracking-widest text-[10px] sm:text-xs">New Task</span>
            </button>
          </div>
        </header>

        <DashboardStats tasks={tasks} />

        {/* Toolbar */}
        <section className="bg-neu-base shadow-neu-flat p-5 sm:p-8 rounded-3xl sm:rounded-[40px] mb-8 sm:mb-12 flex flex-col lg:flex-row gap-6 sm:gap-8 justify-between items-center z-20 relative">
          
          {/* Search */}
          <div className="relative w-full lg:w-[400px]">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 sm:pl-16 pr-5 sm:pr-6 py-4 sm:py-5 bg-neu-base shadow-neu-pressed rounded-2xl sm:rounded-3xl outline-none focus:text-neu-accent transition-all font-bold placeholder:text-gray-400 placeholder:font-normal text-neu-text text-base sm:text-lg"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto justify-end">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="w-full sm:w-auto bg-neu-base shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 outline-none cursor-pointer font-bold text-gray-600 appearance-none transition-all text-center uppercase tracking-wide text-[10px] sm:text-xs"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
              <div className="relative w-full sm:w-auto">
                <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full sm:w-auto bg-neu-base shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed rounded-xl pl-9 sm:pl-10 pr-6 sm:pr-8 py-2 sm:py-2.5 outline-none cursor-pointer font-bold text-gray-600 appearance-none transition-all uppercase tracking-wide text-[10px] sm:text-xs"
                >
                  <option value="manual">Manual Order (Drag)</option>
                  <option value="dueDateAsc">Date (Earliest)</option>
                  <option value="dueDateDesc">Date (Latest)</option>
                  <option value="priorityDesc">Priority (High-Low)</option>
                  <option value="priorityAsc">Priority (Low-High)</option>
                </select>
              </div>

              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as 'All' | 'High' | 'Medium' | 'Low')}
                className="w-full sm:w-auto bg-neu-base shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 outline-none cursor-pointer font-bold text-gray-600 appearance-none transition-all text-center uppercase tracking-wide text-[10px] sm:text-xs"
              >
                <option value="All">All Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              {allCategories.length > 0 && (
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full sm:w-auto bg-neu-base shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 outline-none cursor-pointer font-bold text-gray-600 appearance-none transition-all text-center uppercase tracking-wide text-[10px] sm:text-xs"
                >
                  <option value="All">All Tags</option>
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </section>

        {/* Task List */}
        <section>
          {filteredAndSortedTasks.length > 0 ? (
            <Reorder.Group 
              axis="y" 
              values={filteredAndSortedTasks} 
              onReorder={handleReorder}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10"
            >
              <AnimatePresence mode="popLayout">
                {filteredAndSortedTasks.map(task => (
                  <Reorder.Item
                    key={task.id}
                    value={task}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <TaskCard 
                      task={task} 
                      onUpdate={handleUpdateTask} 
                      onDelete={handleDeleteTask} 
                      onEdit={(t) => {
                        setEditingTask(t);
                        setIsFormOpen(true);
                      }}
                    />
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          ) : (
            <div className="text-center py-16 sm:py-24 px-4 sm:px-6 bg-neu-base shadow-neu-pressed rounded-3xl sm:rounded-[48px] max-w-2xl mx-auto mt-8 sm:mt-16 border-2 border-white/20">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-neu-base shadow-neu-flat rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                <Search className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-neu-text mb-3 sm:mb-4">No tasks found</h3>
              <p className="text-sm sm:text-lg text-gray-500 max-w-md mx-auto mb-8 sm:mb-10 leading-relaxed font-medium">
                {tasks.length === 0 
                  ? "You haven't created any tasks yet. Get started by creating your first task!"
                  : "We couldn't find any tasks matching your current filters."}
              </p>
              {tasks.length === 0 && (
                <button 
                  onClick={() => setIsFormOpen(true)}
                  className="bg-neu-base shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed text-neu-accent px-8 sm:px-12 py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-extrabold uppercase tracking-widest transition-all duration-200 text-sm sm:text-base"
                >
                  Create First Task
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <TaskForm 
          initialTask={editingTask}
          onSave={handleSaveTask}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingTask(null);
          }}
        />
      )}
    </main>
  );
}
