'use client';

import React, { useState } from 'react';

interface DevPanelProps {
  delay: number;
  onDelayChange: (delay: number) => void;
  fail: boolean;
  onFailChange: (fail: boolean) => void;
  rawStats: {
    totalServices: number;
    visibleServices: number;
    totalProviders: number;
    activeProviders: number;
  };
}

export function DevPanel({
  delay,
  onDelayChange,
  fail,
  onFailChange,
  rawStats,
}: DevPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 shadow-2xl border border-slate-700 w-80 space-y-3.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold uppercase tracking-wider text-slate-300">
                Mock API Dev Panel
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>Total Services:</span>
              <span className="font-mono text-slate-200">{rawStats.totalServices}</span>
            </div>
            <div className="flex justify-between">
              <span>Visible (Active) Services:</span>
              <span className="font-mono text-emerald-400">{rawStats.visibleServices}</span>
            </div>
            <div className="flex justify-between">
              <span>Providers (Active / Total):</span>
              <span className="font-mono text-slate-200">
                {rawStats.activeProviders} / {rawStats.totalProviders}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="block text-slate-300 font-medium">
              Simulated Network Latency: {delay}ms
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[0, 300, 1000, 2500].map((d) => (
                <button
                  key={d}
                  onClick={() => onDelayChange(d)}
                  className={`py-1 px-1.5 rounded font-mono text-[11px] border ${
                    delay === d
                      ? 'bg-teal-600 border-teal-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {d}ms
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300 font-medium">Inject API Failure (500)</span>
              <input
                type="checkbox"
                checked={fail}
                onChange={(e) => onFailChange(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500 w-4 h-4 cursor-pointer"
              />
            </label>
            <p className="text-[10px] text-slate-400">
              When checked, mock endpoints return 500 error to inspect the retry UI state.
            </p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900/90 hover:bg-slate-900 text-slate-200 hover:text-white px-3 py-2 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2 text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer"
          title="Open Dev & Latency Testing Panel"
        >
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Dev Tools</span>
        </button>
      )}
    </div>
  );
}
