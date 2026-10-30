import React from 'react';

export function CalendarSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <div className="h-6 w-36 bg-slate-200 rounded-md" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-slate-100 rounded-lg" />
          <div className="h-8 w-8 bg-slate-100 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-50 rounded-xl border border-slate-100" />
        ))}
      </div>
    </div>
  );
}

export function SlotsSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
      <div className="h-5 w-44 bg-slate-200 rounded-md" />
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
