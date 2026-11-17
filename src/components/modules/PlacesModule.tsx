import React from 'react';
import { MapPin } from 'lucide-react';
import { LifeOSMapPlanner } from '../LifeOSMapPlanner';

export const PlacesModule: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-fuchsia-600 dark:text-fuchsia-400 inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>LIFEOS Spatial &amp; Commute Intelligence</span>
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-1">
            Places, Work Hubs &amp; Route Planner
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Search real destinations, discover nearby coworking cafés or transit stations, estimate commute durations, and save trips directly to your schedule.
          </p>
        </div>
      </div>

      <LifeOSMapPlanner />
    </div>
  );
};
