"use client";

import React from 'react';
import { Task } from '../types';
import { LayoutList, CheckCircle2, CircleDashed, TrendingUp } from 'lucide-react';
import { TiltCard } from './SpecialEffects';

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
    { label: 'Total Tasks', value: total, icon: LayoutList, tone: 'info' },
    { label: 'Completed', value: completed, icon: CheckCircle2, tone: 'success' },
    { label: 'Pending', value: pending, icon: CircleDashed, tone: 'warning' },
    { label: 'Completion', value: `${percentage}%`, icon: TrendingUp, tone: 'primary' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8 sm:mb-16">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <TiltCard key={i} className="h-full">
            <div className="stat-tile h-full" data-tone={stat.tone}>
              <div className="stat-head">
                <span className="stat-eyebrow">{stat.label}</span>
                <Icon className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
              </div>
              <div className="stat-value">{stat.value}</div>
            </div>
          </TiltCard>
        );
      })}
    </div>
  );
}
