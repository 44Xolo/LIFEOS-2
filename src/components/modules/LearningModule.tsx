import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Bot, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import type { LearningTrack } from '../../types/lifeos';
import { EASE_OUT_EXPO, RadialGauge } from '../MotionPrimitives';

export const LearningModule: React.FC = () => {
  const {
    learningTracks,
    addLearningTrack,
    advanceLearningTrack,
    updateLearningReminder,
    deleteLearningTrack,
    askAiWithPrompt,
  } = useLifeOS();

  const [title, setTitle] = useState('');
  const [skillArea, setSkillArea] = useState('Web Development');
  const [level, setLevel] = useState<LearningTrack['level']>('beginner');
  const [totalLessons, setTotalLessons] = useState('10');
  const [nextTopic, setNextTopic] = useState('');
  const [studyReminder, setStudyReminder] = useState('Mon & Thu · 18:30');

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !nextTopic.trim()) return;
    await addLearningTrack({
      title,
      skillArea,
      level,
      totalLessons: Number(totalLessons) || 8,
      nextTopic,
      studyReminder,
    });
    setTitle('');
    setNextTopic('');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-fuchsia-600 dark:text-fuchsia-400">LIFEOS Learning</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-1">
            Skill Development &amp; Study Plans
          </h1>
        </div>
        <button
          type="button"
          onClick={() =>
            askAiWithPrompt(
              'Suggest a structured 4-week beginner-friendly learning plan to improve my mobile web development and small business financial skills.'
            )
          }
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg lifeos-gradient-bg text-white text-xs font-semibold hover:opacity-95 transition-opacity cursor-pointer w-fit"
        >
          <Bot className="w-4 h-4" />
          <span>Generate AI Study Plan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleAddTrack}
          className="lg:col-span-4 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 space-y-4 h-fit"
        >
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
            New Learning Track
          </h2>
          <input
            type="text"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Track title (e.g. TypeScript & React)"
            className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              required
              maxLength={60}
              value={skillArea}
              onChange={(e) => setSkillArea(e.target.value)}
              placeholder="Skill domain"
              className="px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
            />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as LearningTrack['level'])}
              className="px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="1"
              max="200"
              value={totalLessons}
              onChange={(e) => setTotalLessons(e.target.value)}
              placeholder="Lessons"
              className="px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm font-mono outline-none focus:border-fuchsia-500"
            />
            <input
              type="text"
              maxLength={60}
              value={studyReminder}
              onChange={(e) => setStudyReminder(e.target.value)}
              placeholder="Study schedule"
              className="px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
            />
          </div>
          <input
            type="text"
            required
            maxLength={140}
            value={nextTopic}
            onChange={(e) => setNextTopic(e.target.value)}
            placeholder="First topic to learn"
            className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
          />
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-sm font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Learning Plan</span>
          </button>
        </form>

        <div className="lg:col-span-8 space-y-4">
          {learningTracks.map((track, idx) => {
            const pct = (track.completedLessons / Math.max(1, track.totalLessons)) * 100;
            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ delay: idx * 0.05, duration: 0.3, ease: EASE_OUT_EXPO }}
                className="bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-5 min-w-0">
                  <RadialGauge percentage={pct} size={78} label="Mastery" />
                  <div className="min-w-0 space-y-1.5">
                    <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 capitalize">
                      {track.skillArea} · {track.level} · {track.completedLessons}/{track.totalLessons} lessons
                    </div>
                    <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-white truncate">
                      {track.title}
                    </h3>
                    <div className="text-xs text-zinc-600 dark:text-zinc-300">
                      Next Topic: <span className="font-medium text-fuchsia-600 dark:text-fuchsia-400">{track.nextTopic}</span>
                    </div>
                    {track.studyReminder && (
                      <div className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <Bell className="w-3 h-3 text-indigo-500" />
                        <span>{track.studyReminder}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-col items-stretch sm:items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      askAiWithPrompt(
                        `Explain "${track.nextTopic}" from my "${track.title}" (${track.level}) track in beginner-friendly language with one practical exercise.`
                      )
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg lifeos-gradient-bg text-white text-xs font-medium cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Explain with AI</span>
                  </button>

                  {track.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => advanceLearningTrack(track)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:border-fuchsia-500/40 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Complete Lesson</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => updateLearningReminder(track.id, 'Daily · 19:00')}
                      className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                    >
                      Set Daily 19:00
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteLearningTrack(track.id)}
                      className="p-1 text-zinc-400 hover:text-red-500 cursor-pointer"
                      aria-label={`Delete ${track.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {learningTracks.length === 0 && (
            <div className="p-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0C0C14] text-center text-sm text-zinc-500 dark:text-zinc-400">
              No learning tracks yet. Create one on the left or ask AI to plan a curriculum.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
