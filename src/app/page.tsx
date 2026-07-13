"use client";

import React, { useState, useMemo } from 'react';
import { Task, FilterStatus, SortOption } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import TaskCard from './components/TaskCard';
import TaskForm from './components/TaskForm';
import DashboardStats from './components/DashboardStats';
import { Plus, Search, SlidersHorizontal, LayoutDashboard, Moon, Sun, Download, Upload, Zap } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ParticleBackground, MouseFollower } from './components/SpecialEffects';
import LineSidebar from './components/LineSidebar';
import { CalendarCustomDays } from './components/CalendarCustomDays';
import { type DateRange } from 'react-day-picker';
import Lightfall from './components/Lightfall';
import { BentoGrid } from './components/BentoGrid';
import { cn } from './utils';
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";

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
  const [activeSidebarIndex, setActiveSidebarIndex] = useState<number>(0);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [bgEffect, setBgEffect] = useState<'particles' | 'lightfall'>('particles');

  // Sync sidebar active tab to toolbar filters
  React.useEffect(() => {
    if (activeSidebarIndex === 5) return; // Keep calendar view active
    
    if (statusFilter === 'All' && priorityFilter === 'All') {
      setActiveSidebarIndex(0);
    } else if (statusFilter === 'Active' && priorityFilter === 'All') {
      setActiveSidebarIndex(1);
    } else if (statusFilter === 'Completed' && priorityFilter === 'All') {
      setActiveSidebarIndex(2);
    } else if (statusFilter === 'All' && priorityFilter === 'High') {
      setActiveSidebarIndex(3);
    } else if (statusFilter === 'All' && priorityFilter === 'Low') {
      setActiveSidebarIndex(4);
    } else {
      setActiveSidebarIndex(-1);
    }
  }, [statusFilter, priorityFilter, activeSidebarIndex]);

  const handleSidebarClick = (index: number) => {
    setActiveSidebarIndex(index);
    if (index === 0) {
      setStatusFilter('All');
      setPriorityFilter('All');
    } else if (index === 1) {
      setStatusFilter('Active');
      setPriorityFilter('All');
    } else if (index === 2) {
      setStatusFilter('Completed');
      setPriorityFilter('All');
    } else if (index === 3) {
      setStatusFilter('All');
      setPriorityFilter('High');
    } else if (index === 4) {
      setStatusFilter('All');
      setPriorityFilter('Low');
    } else if (index === 5) {
      setStatusFilter('All');
      setPriorityFilter('All');
    }
  };

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

    if (activeSidebarIndex === 5 && selectedDateRange) {
      const fromTime = selectedDateRange.from ? new Date(selectedDateRange.from).setHours(0,0,0,0) : null;
      const toTime = selectedDateRange.to ? new Date(selectedDateRange.to).setHours(23,59,59,999) : null;
      
      result = result.filter(t => {
        if (!t?.dueDate) return false;
        const taskTime = new Date(t.dueDate).getTime();
        
        if (fromTime && toTime) {
          return taskTime >= fromTime && taskTime <= toTime;
        } else if (fromTime) {
          const dayStart = fromTime;
          const dayEnd = dayStart + 24 * 60 * 60 * 1000;
          return taskTime >= dayStart && taskTime < dayEnd;
        }
        return true;
      });
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
  }, [safeTasks, searchQuery, statusFilter, priorityFilter, categoryFilter, sortOption, activeSidebarIndex, selectedDateRange]);

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
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-transparent text-[var(--color-text-primary)] pb-12 pt-6 sm:pb-16 sm:pt-10 selection:bg-[var(--color-primary-soft)] relative overflow-hidden">
      {bgEffect === 'particles' ? (
        <ParticleBackground />
      ) : (
        <div className="absolute inset-0 -z-20 pointer-events-none opacity-40">
          <Lightfall 
            colors={isDarkMode ? ['#3b82f6', '#8b5cf6', '#ec4899'] : ['#60a5fa', '#a78bfa', '#f472b6']} 
            backgroundColor={isDarkMode ? '#030712' : '#f8fafc'}
            speed={0.4}
            streakCount={6}
            streakWidth={0.8}
            streakLength={1.2}
            glow={1.2}
            density={0.5}
            zoom={2.5}
            backgroundGlow={0.2}
          />
        </div>
      )}
      <MouseFollower />
      
      {/* Decorative backdrop gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-650/10 rounded-full blur-[120px] -z-10 pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-550/10 dark:bg-blue-500/10 rounded-full blur-[120px] -z-10 pointer-events-none animate-pulse delay-1000"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 sm:gap-10 items-start">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-64 lg:sticky lg:top-10 flex-shrink-0 card stack-sm">
            <h2 className="t-label-sm">Quick Filters</h2>
            <LineSidebar
              items={['All Tasks', 'Active Tasks', 'Completed', 'High Priority', 'Low Priority', 'Calendar View']}
              accentColor="var(--color-primary)"
              textColor="var(--color-text-secondary)"
              markerColor="var(--color-border)"
              activeIndex={activeSidebarIndex >= 0 ? activeSidebarIndex : null}
              onItemClick={handleSidebarClick}
              fontSize={0.9}
              itemGap={14}
              maxShift={12}
              markerLength={20}
              showIndex={false}
              className="w-full"
            />
          </aside>

          {/* Main Dashboard Panel */}
          <div className="flex-1 w-full">
        
            {/* Header */}
            <header className="nav mb-8 sm:mb-12">
              <div className="nav-brand">
                <div className="nav-brand-mark" />
                <span className="t-title-md uppercase tracking-wider">TaskMaster</span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  accept=".json" 
                  id="import-backup" 
                  className="hidden" 
                  onChange={importTasks} 
                />
                <label 
                  htmlFor="import-backup"
                  className="btn btn-secondary btn-icon btn-sm"
                  title="Import Backup"
                >
                  <Upload className="w-4 h-4" />
                </label>
                <button 
                  onClick={exportTasks}
                  className="btn btn-secondary btn-icon btn-sm"
                  title="Export Backup"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setBgEffect(bgEffect === 'particles' ? 'lightfall' : 'particles')}
                  className="btn btn-secondary btn-icon btn-sm text-[var(--color-primary)]"
                  aria-label="Toggle Background Animation"
                  title="Toggle Background Animation"
                >
                  <Zap className="w-4 h-4 animate-pulse" />
                </button>
                <AnimatedThemeToggler 
                  checked={isDarkMode} 
                  onCheckedChange={setIsDarkMode} 
                />
                <button 
                  onClick={() => { setEditingTask(null); setIsFormOpen(true); }}
                  className="btn btn-primary btn-sm ml-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Task</span>
                </button>
              </div>
            </header>

            <DashboardStats tasks={tasks} />

            {/* Calendar View */}
            {activeSidebarIndex === 5 && (
              <div className="mb-8 flex flex-col items-center">
                <div className="text-center mb-6">
                  <h2 className="t-headline-md mb-2">Calendar Explorer</h2>
                  <p className="t-body-sm">
                    {selectedDateRange?.from ? (
                      selectedDateRange.to ? (
                        <span>Showing tasks from <strong>{selectedDateRange.from.toLocaleDateString()}</strong> to <strong>{selectedDateRange.to.toLocaleDateString()}</strong></span>
                      ) : (
                        <span>Showing tasks for <strong>{selectedDateRange.from.toLocaleDateString()}</strong></span>
                      )
                    ) : (
                      "Select a day or drag to select a range to filter tasks"
                    )}
                  </p>
                </div>
                
                <CalendarCustomDays
                  tasks={safeTasks}
                  selectedRange={selectedDateRange}
                  onRangeSelect={setSelectedDateRange}
                />

                {selectedDateRange && (
                  <button
                    onClick={() => setSelectedDateRange(undefined)}
                    className="mt-4 btn btn-tertiary btn-sm"
                  >
                    Clear Date Filter
                  </button>
                )}
              </div>
            )}

            {/* Toolbar */}
            <section className="card flex flex-col lg:flex-row gap-6 justify-between items-center z-20 relative mb-8 sm:mb-12">
              
              {/* Search */}
              <div className="input-group w-full lg:w-[400px]">
                <span className="input-icon">
                  <Search className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  placeholder="Search tasks..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                  className="select w-full sm:w-auto text-[var(--color-text-secondary)] font-medium"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
                
                <div className="relative w-full sm:w-auto">
                  <SlidersHorizontal className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none" />
                  <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="select pl-10 w-full sm:w-auto text-[var(--color-text-secondary)] font-medium"
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
                  className="select w-full sm:w-auto text-[var(--color-text-secondary)] font-medium"
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
                    className="select w-full sm:w-auto text-[var(--color-text-secondary)] font-medium"
                  >
                    <option value="All">All Tags</option>
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
              </div>
            </section>

            {/* Task List */}
            <section>
              {filteredAndSortedTasks.length > 0 ? (
                <Reorder.Group 
                  axis="y" 
                  values={filteredAndSortedTasks} 
                  onReorder={handleReorder}
                  as="div"
                  layoutScroll
                  className="w-full"
                >
                  <BentoGrid>
                    <AnimatePresence mode="popLayout">
                      {filteredAndSortedTasks.map((task, index) => {
                        const isHigh = task.priority === 'High' && !task.completed;
                        const colSpanClass = isHigh ? "md:col-span-2" : "md:col-span-1";
                        
                        return (
                          <Reorder.Item
                            key={task.id}
                            value={task}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            whileDrag={{ scale: 1.04, rotate: -0.5, zIndex: 50 }}
                            transition={{ duration: 0.3 }}
                            className={cn("cursor-grab active:cursor-grabbing", colSpanClass)}
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
                        );
                      })}
                    </AnimatePresence>
                  </BentoGrid>
                </Reorder.Group>
              ) : (
                <div className="card text-center py-16 max-w-2xl mx-auto mt-8">
                  <div className="w-16 h-16 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-6 h-6 text-[var(--color-text-secondary)]" />
                  </div>
                  <h3 className="t-title-md mb-3">No tasks found</h3>
                  <p className="t-body-sm max-w-md mx-auto mb-8">
                    {tasks.length === 0 
                      ? "You haven't created any tasks yet. Get started by creating your first task!"
                      : "We couldn't find any tasks matching your current filters."}
                  </p>
                  {tasks.length === 0 && (
                    <button 
                      onClick={() => setIsFormOpen(true)}
                      className="btn btn-primary"
                    >
                      Create First Task
                    </button>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
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
