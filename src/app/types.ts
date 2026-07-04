export type Priority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO string format
  priority: Priority;
  categories: string[];
  completed: boolean;
  createdAt: string;
}

export type FilterStatus = 'All' | 'Active' | 'Completed';

export type SortOption = 'dueDateAsc' | 'dueDateDesc' | 'priorityAsc' | 'priorityDesc';
