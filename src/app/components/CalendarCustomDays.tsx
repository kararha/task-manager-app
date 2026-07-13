"use client"

import * as React from "react"
import { type DateRange } from "react-day-picker"
import { Task } from "../types"

import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"

interface CalendarCustomDaysProps {
  tasks: Task[]
  selectedRange: DateRange | undefined
  onRangeSelect: (range: DateRange | undefined) => void
}

export function CalendarCustomDays({ tasks, selectedRange, onRangeSelect }: CalendarCustomDaysProps) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  return (
    <Card className="mx-auto w-fit p-0 border border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
      <CardContent className="p-0">
        <Calendar
          mode="range"
          selected={selectedRange}
          onSelect={onRangeSelect}
          numberOfMonths={1}
          className="[--cell-size:52px] md:[--cell-size:60px]"
          components={{
            DayButton: ({ children, modifiers, day, ...props }) => {
              // Calculate tasks due on this specific day
              const dayTasks = safeTasks.filter(t => {
                const dueDate = new Date(t.dueDate)
                return dueDate.getDate() === day.date.getDate() &&
                       dueDate.getMonth() === day.date.getMonth() &&
                       dueDate.getFullYear() === day.date.getFullYear()
              })

              const hasTasks = dayTasks.length > 0

              return (
                <CalendarDayButton day={day} modifiers={modifiers} {...props} className="relative">
                  {children}
                  {!modifiers.outside && hasTasks && (
                    <span className={`text-[9px] font-extrabold mt-0.5 px-1 py-0.25 rounded-md ${
                      modifiers.selected 
                        ? 'bg-white text-blue-600' 
                        : 'bg-blue-500/10 text-blue-500 dark:text-blue-400'
                    }`}>
                      {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  )}
                </CalendarDayButton>
              )
            },
          }}
        />
      </CardContent>
    </Card>
  )
}
