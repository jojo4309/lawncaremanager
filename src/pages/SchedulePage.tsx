import { useState } from 'react'
import { format, addDays, subDays, startOfWeek, isSameDay, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, CloudRain, Clock, Undo2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useJobs, useUpdateJob } from '../hooks/useJobs'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { formatCurrency, formatTime } from '../lib/utils'
import type { ServiceJob } from '../types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SERVICE_FILTERS = ['All', 'Mowing', 'Edging', 'Weed Eating', 'Mulching', 'Trimming', 'Fertilizing', 'Leaf Removal', 'Other']

export function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [filter, setFilter] = useState('All')

  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const { data: jobs = [], isLoading } = useJobs({ date: dateStr })
  const updateJob = useUpdateJob()

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const filtered = filter === 'All'
    ? jobs
    : jobs.filter(j => j.service_type?.split(', ').some(s => s === filter))

  async function markComplete(job: ServiceJob) {
    await updateJob.mutateAsync({
      id: job.id,
      status: 'completed',
      completed_date: format(new Date(), 'yyyy-MM-dd'),
    })
  }

  async function rainDelay(job: ServiceJob) {
    // Move to next day and mark as rain_delay
    const next = format(addDays(parseISO(job.scheduled_date), 1), 'yyyy-MM-dd')
    await updateJob.mutateAsync({ id: job.id, status: 'rain_delay', scheduled_date: next })
  }

  async function undoRainDelay(job: ServiceJob) {
    // Reverse: move back one day and restore scheduled status
    const prev = format(subDays(parseISO(job.scheduled_date), 1), 'yyyy-MM-dd')
    await updateJob.mutateAsync({ id: job.id, status: 'scheduled', scheduled_date: prev })
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader
        title="Schedule"
        subtitle={format(selectedDate, 'MMMM yyyy')}
        actions={
          <Link to="/jobs/new">
            <Button size="sm"><Plus className="w-4 h-4" />Add</Button>
          </Link>
        }
      />

      {/* Week strip */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-2 py-2">
        <div className="flex items-center justify-between mb-1 px-2">
          <button
            onClick={() => setWeekStart(w => addDays(w, -7))}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => { setWeekStart(startOfWeek(new Date())); setSelectedDate(new Date()) }}
            className="text-xs font-medium text-green-600 dark:text-green-400 px-2 py-1 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            Today
          </button>
          <button
            onClick={() => setWeekStart(w => addDays(w, 7))}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => {
            const isSelected = isSameDay(day, selectedDate)
            const isToday = isSameDay(day, new Date())
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center py-1.5 rounded-xl transition-colors ${
                  isSelected ? 'bg-green-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className={`text-[10px] font-medium ${isSelected ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {DAYS[day.getDay()]}
                </span>
                <span className={`text-sm font-semibold ${
                  isSelected ? 'text-white' : isToday ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {format(day, 'd')}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Service filter */}
      <div className="px-4 py-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max">
          {SERVICE_FILTERS.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                filter === t
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {format(selectedDate, 'EEEE, MMMM d')} · {filtered.length} job{filtered.length !== 1 ? 's' : ''}
        </p>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white dark:bg-gray-900 rounded-xl animate-pulse border border-gray-200 dark:border-gray-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-8 h-8" />}
            title="No jobs scheduled"
            description="Tap 'Add' to schedule a job for this day"
            action={
              <Link to="/jobs/new">
                <Button size="sm"><Plus className="w-4 h-4" />Schedule Job</Button>
              </Link>
            }
          />
        ) : (
          filtered.map(job => (
            <Card key={job.id} className="overflow-hidden">
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {job.route_order && (
                        <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {job.route_order}
                        </span>
                      )}
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                        {(job as any).property?.customer?.name}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {(job as any).property?.address}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <Badge status={job.status} />
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                        {job.service_type}
                      </span>
                      {job.scheduled_time && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{formatTime(job.scheduled_time)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(job.price)}
                    </span>
                    <div className="flex gap-1">
                      {job.status === 'rain_delay' ? (
                        // Rain-delayed: show undo button
                        <button
                          onClick={() => undoRainDelay(job)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-200 transition-colors"
                          title="Undo rain delay — move back to previous day"
                        >
                          <Undo2 className="w-3 h-3" />Undo
                        </button>
                      ) : job.status !== 'completed' && job.status !== 'cancelled' ? (
                        // Scheduled / in_progress: show rain delay + done
                        <button
                          onClick={() => rainDelay(job)}
                          className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 transition-colors"
                          title="Rain delay — move to tomorrow"
                        >
                          <CloudRain className="w-3.5 h-3.5" />
                        </button>
                      ) : null}

                      {job.status !== 'completed' && job.status !== 'cancelled' && (
                        <button
                          onClick={() => markComplete(job)}
                          className="px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium hover:bg-green-200 transition-colors"
                        >
                          Done
                        </button>
                      )}

                      <Link
                        to={`/jobs/${job.id}`}
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 transition-colors text-xs"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Gate code hint */}
                {(job as any).property?.gate_code && (
                  <div className="mt-2 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                      Gate code: {(job as any).property.gate_code}
                    </p>
                  </div>
                )}

                {/* Rain delay notice */}
                {job.status === 'rain_delay' && (
                  <div className="mt-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-1.5">
                    <CloudRain className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Rain delayed from previous day — tap Undo to move back
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
