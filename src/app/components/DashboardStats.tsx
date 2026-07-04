"use client";

import React from 'react';
import { Task } from '../types';
import { LayoutList, CheckCircle2, CircleDashed, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  tasks: Task[];
}

export default function DashboardStats({ tasks }: DashboardStatsProps) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const total = safeTasks.length;
  const completed = safeTasks.filter(t => t?.completed).length;
  const pending = total - completed;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  const stats = [
    { label: 'Total Tasks', value: total, icon: LayoutList, color: 'text-neu-accent' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'Pending', value: pending, icon: CircleDashed, color: 'text-orange-500' },
    { label: 'Completion', value: `${percentage}%`, icon: TrendingUp, color: 'text-purple-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-8 sm:mb-16">
      {stats.map((stat, i) => (
        <div key={i} className="p-4 sm:p-8 rounded-2xl sm:rounded-[32px] bg-neu-base shadow-neu-flat flex flex-col items-center text-center">
          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-neu-base shadow-neu-pressed flex items-center justify-center mb-4 sm:mb-6`}>
            <stat.icon className={`w-5 h-5 sm:w-7 sm:h-7 ${stat.color}`} />
          </div>
          <div className="text-2xl sm:text-4xl font-extrabold text-neu-text mb-1 sm:mb-2">{stat.value}</div>
          <h4 className="text-gray-500 font-bold text-xs sm:text-sm uppercase tracking-wider sm:tracking-widest">{stat.label}</h4>
        </div>
      ))}
    </div>
  );
}
