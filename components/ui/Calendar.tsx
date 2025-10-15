'use client'

import React, { useState, useEffect } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: 'content_published' | 'seo_optimized' | 'content_generated' | 'social_shared'
  project?: string
}

interface CalendarProps {
  events?: CalendarEvent[]
  onDateSelect?: (date: Date) => void
  selectedDate?: Date
  className?: string
}

const eventTypeColors = {
  content_published: 'bg-green-500',
  seo_optimized: 'bg-blue-500',
  content_generated: 'bg-purple-500',
  social_shared: 'bg-orange-500'
}

export function Calendar({ events = [], onDateSelect, selectedDate, className }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null)

  useEffect(() => {
    setCurrentDate(new Date())
  }, [])

  if (!currentDate) {
    return (
      <div className={cn("bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700", className)}>
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          Loading calendar...
        </div>
      </div>
    )
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date))
  }

  const renderCalendarDays = () => {
    const days = []
    let day = startDate

    while (day <= endDate) {
      const dayEvents = getEventsForDate(day)
      const isCurrentMonth = isSameMonth(day, currentDate)
      const isSelected = selectedDate && isSameDay(day, selectedDate)
      const isCurrentDay = isToday(day)

      days.push(
        <div
          key={day.toString()}
          className={cn(
            "relative p-2 h-12 flex flex-col items-center justify-start cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
            !isCurrentMonth && "text-gray-400 dark:text-gray-600",
            isSelected && "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100",
            isCurrentDay && !isSelected && "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
          )}
          onClick={() => onDateSelect?.(day)}
        >
          <span className={cn(
            "text-sm font-medium",
            isCurrentDay && "font-bold"
          )}>
            {format(day, 'd')}
          </span>
          <div className="flex space-x-1 mt-1">
            {dayEvents.slice(0, 3).map((event, index) => (
              <div
                key={event.id}
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  eventTypeColors[event.type]
                )}
                title={event.title}
              />
            ))}
            {dayEvents.length > 3 && (
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" title={`+${dayEvents.length - 3} more`} />
            )}
          </div>
        </div>
      )
      day = addDays(day, 1)
    }

    return days
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Published</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600 dark:text-gray-400">SEO Optimized</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Generated</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Shared</span>
          </div>
        </div>
      </div>
    </div>
  )
}


