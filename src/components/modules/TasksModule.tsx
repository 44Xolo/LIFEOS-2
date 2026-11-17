import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CalendarDays, Check, Clock, Plus, Trash2 } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { addDaysIsoDate, formatHumanDate, todayIsoDate } from '../../lib/formatters';
import type { LifeTask } from '../../types/lifeos';
import { EASE_OUT_EXPO } from '../MotionPrimitives';
import { LifeOSMapPlanner } from '../LifeOSMapPlanner';

export const TasksModule: React.FC = () => {
  const { tasks, addTask, toggleTaskStatus, deleteTask } = useLifeOS();

  const [viewMode, setViewMode] = useState<'list' | 'week' | 'map'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<LifeTask['category']>('work');
  const [priority, setPriority] = useState<LifeTask['priority']>('medium');
  const [dueDate, setDueDate] = useState(todayIsoDate());
  const [timeSlot, setTimeSlot] = useState('');

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const iso = addDaysIsoDate(i);
      const d = new Date(`${iso}T12:00:00`);
      return {
        iso,
        dayName: d.toLocaleDateString('en-ZA', { weekday: 'short' }),
        dayNum: d.getDate(),
      };
    });
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
  }, [tasks, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addTask({
      title,
      category,
      priority,
      dueDate,
      timeSlot: timeSlot || undefined,
    });
    setTitle('');
    setTimeSlot('');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-fuchsia-600 dark:text-fuchsia-400">
            LIFEOS Personal Organisation
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-1">
            Daily Tasks, Deadlines &amp; Schedule
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-200/70 dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800">
          {([
            { id: 'list', label: 'Task Queue' },
            { id: 'week', label: '7-Day Planner' },
            { id: 'map', label: 'Places & Routes' },
          ] as const).map((m) => {
            const active = viewMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setViewMode(m.id)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${
                  active ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="tasks-viewmode"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 lifeos-gradient-bg rounded-lg"
                  />
                )}
                <span className="relative z-10">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {viewMode === 'map' ? (
        <LifeOSMapPlanner />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-4 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 space-y-4 h-fit"
        >
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
            Schedule Task or Appointment
          </h2>

          <input
            type="text"
            required
            maxLength={140}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task or appointment title"
            className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as LifeTask['category'])}
              className="px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
            >
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="finance">Finance</option>
              <option value="learning">Learning</option>
              <option value="health">Health</option>
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as LifeTask['priority'])}
              className="px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm font-mono outline-none focus:border-fuchsia-500"
            />
            <input
              type="text"
              maxLength={20}
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              placeholder="Time (e.g. 14:30)"
              className="px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm font-mono outline-none focus:border-fuchsia-500"
            />
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg lifeos-gradient-bg text-white text-sm font-semibold hover:opacity-95 transition-opacity cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Schedule</span>
          </button>
        </form>

        <div className="lg:col-span-8">
          {viewMode === 'list' ? (
            <div className="bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
                <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
                  Action List
                </h2>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-[#050508]">
                  {(['pending', 'completed', 'all'] as const).map((s) => {
                    const active = statusFilter === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatusFilter(s)}
                        className={`relative px-2.5 py-1 text-xs font-medium rounded-md capitalize cursor-pointer ${
                          active ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="tasks-statusfilter"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            className="absolute inset-0 lifeos-gradient-bg rounded-md"
                          />
                        )}
                        <span className="relative z-10">{s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {filteredTasks.map((task) => {
                  const done = task.status === 'completed';
                  return (
                    <motion.div
                      key={task.id}
                      layout
                      transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                      className="p-4 sm:px-5 flex items-center justify-between gap-4 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleTaskStatus(task)}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            done
                              ? 'lifeos-gradient-bg border-fuchsia-500 text-white'
                              : 'border-zinc-300 dark:border-zinc-600 hover:border-fuchsia-500'
                          }`}
                          aria-label={`Toggle ${task.title}`}
                        >
                          {done && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div className="min-w-0">
                          <div
                            className={`text-sm font-medium ${
                              done
                                ? 'line-through text-zinc-400 dark:text-zinc-500'
                                : 'text-zinc-900 dark:text-white'
                            }`}
                          >
                            {task.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            <span className="font-mono">{formatHumanDate(task.dueDate)}</span>
                            {task.timeSlot && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3" />
                                  {task.timeSlot}
                                </span>
                              </>
                            )}
                            <span>·</span>
                            <span className="capitalize">{task.category}</span>
                            <span>·</span>
                            <span
                              className={`capitalize font-medium ${
                                task.priority === 'high'
                                  ? 'text-fuchsia-600 dark:text-fuchsia-400'
                                  : task.priority === 'medium'
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : ''
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 cursor-pointer shrink-0"
                        aria-label={`Delete ${task.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  );
                })}
                {filteredTasks.length === 0 && (
                  <div className="p-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    No tasks in this view.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {weekDays.map((day) => {
                const dayTasks = tasks.filter((t) => t.dueDate === day.iso);
                return (
                  <div
                    key={day.iso}
                    className="bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {day.dayName} {day.dayNum}
                      </span>
                      <CalendarDays className="w-4 h-4 text-fuchsia-500" />
                    </div>
                    {dayTasks.length === 0 ? (
                      <p className="text-xs text-zinc-400 py-3">Open day</p>
                    ) : (
                      <div className="space-y-2">
                        {dayTasks.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleTaskStatus(t)}
                            className="w-full text-left p-2 rounded-lg bg-zinc-50 dark:bg-[#050508] hover:border-fuchsia-500/40 border border-transparent transition-colors cursor-pointer"
                          >
                            <div
                              className={`text-xs font-medium ${
                                t.status === 'completed'
                                  ? 'line-through text-zinc-400'
                                  : 'text-zinc-900 dark:text-white'
                              }`}
                            >
                              {t.title}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {t.timeSlot || 'Anytime'} · {t.priority}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
