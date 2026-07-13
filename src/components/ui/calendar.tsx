"use client";

import * as React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export const CalendarDayButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    day: any
    modifiers: any
  }
>(({ className, day, modifiers, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={`w-10 h-10 md:w-12 md:h-12 relative flex flex-col items-center justify-center rounded-2xl transition-all font-semibold ${
        modifiers.selected 
          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-155'
      } ${
        modifiers.today ? 'border-2 border-blue-500/50' : ''
      } ${
        modifiers.outside ? 'text-slate-400 dark:text-slate-600 opacity-40' : ''
      } ${className}`}
      {...props}
    />
  )
})
CalendarDayButton.displayName = "CalendarDayButton"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={`p-4 ${className}`}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-2 relative items-center mb-4",
        caption_label: "text-sm font-extrabold text-slate-800 dark:text-white",
        nav: "space-x-1 flex items-center",
        button_previous: "absolute left-2 h-8 w-8 bg-transparent border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-all text-slate-800 dark:text-white",
        button_next: "absolute right-2 h-8 w-8 bg-transparent border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-all text-slate-800 dark:text-white",
        month_grid: "w-full border-collapse space-y-1 mx-auto",
        weekdays: "flex justify-around mb-2",
        weekday: "text-slate-400 dark:text-slate-500 rounded-md w-10 md:w-12 font-bold text-[0.75rem] uppercase tracking-wider text-center",
        week: "flex justify-around w-full mt-1.5",
        day: "h-10 w-10 md:h-12 md:w-12 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day_button: "h-10 w-10 md:h-12 md:w-12 p-0 font-semibold aria-selected:opacity-100",
        selected: "bg-blue-500 text-white hover:bg-blue-550 focus:bg-blue-500",
        today: "bg-slate-105 dark:bg-slate-800/80 text-slate-900 dark:text-white",
        outside: "day-outside text-slate-400 dark:text-slate-600 opacity-40",
        disabled: "text-slate-400 dark:text-slate-600 opacity-20 cursor-not-allowed",
        range_middle: "aria-selected:bg-blue-500/10 dark:aria-selected:bg-blue-500/10 aria-selected:text-blue-600 dark:aria-selected:text-blue-400",
        range_end: "day-range-end",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
