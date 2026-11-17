import React, { useState } from 'react';
import { ShieldCheck, Box } from 'lucide-react';
import { AiChatSurface } from '../AiChatSurface';
import { LifeOSLogoMark } from '../MotionPrimitives';
import { LifeOS3DCore } from '../LifeOS3DCore';
import { useLifeOS } from '../../context/LifeOSContext';

export const AiAssistantModule: React.FC = () => {
  const { theme } = useLifeOS();
  const [show3D, setShow3D] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <LifeOSLogoMark size="md" showWordmark={false} />
          <div>
            <p className="text-xs font-mono text-fuchsia-600 dark:text-fuchsia-400">
              Central Intelligence · Voice &amp; Web Grounded
            </p>
            <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
              LIFEOS AI Assistant
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShow3D((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              show3D
                ? 'border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-fuchsia-500/40'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>{show3D ? 'Hide 3D Core' : 'Inspect 3D Core'}</span>
          </button>

          <div className="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
            <span>Requires your approval before writing finances, invoices, or tasks</span>
          </div>
        </div>
      </div>

      {show3D && (
        <LifeOS3DCore compact darkSurface={theme === 'dark'} />
      )}

      <div className="bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-2xl overflow-hidden h-[calc(100vh-15rem)] min-h-[480px]">
        <AiChatSurface />
      </div>
    </div>
  );
};
