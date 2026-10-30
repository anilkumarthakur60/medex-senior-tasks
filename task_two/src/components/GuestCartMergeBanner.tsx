'use client';

import React, { useState } from 'react';
import { CartMergeChange } from '../types';

interface GuestCartMergeBannerProps {
  onMerge: () => Promise<CartMergeChange[] | null>;
  isMerging: boolean;
}

export function GuestCartMergeBanner({ onMerge, isMerging }: GuestCartMergeBannerProps) {
  const [mergedChanges, setMergedChanges] = useState<CartMergeChange[] | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleMergeClick = async () => {
    const changes = await onMerge();
    if (changes) {
      setMergedChanges(changes);
    }
  };

  if (isDismissed) return null;

  if (mergedChanges) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              ✓
            </span>
            <h4 className="text-sm font-bold text-emerald-950">
              Guest Cart Successfully Merged!
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>

        <ul className="space-y-1 pl-7 text-xs text-emerald-800 list-disc">
          {mergedChanges.map((change, i) => (
            <li key={i}>{change.details}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-teal-50/60 to-white border border-teal-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-teal-100/80 rounded-xl text-teal-700 shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Saved items from your previous visit detected
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            You have 4 services saved in your guest cart (including Liver Function Profile and Signature Facial). Would you like to merge them with your account?
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          Later
        </button>
        <button
          type="button"
          disabled={isMerging}
          onClick={handleMergeClick}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          {isMerging ? (
            <>
              <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Merging...</span>
            </>
          ) : (
            <span>Merge Guest Cart</span>
          )}
        </button>
      </div>
    </div>
  );
}
