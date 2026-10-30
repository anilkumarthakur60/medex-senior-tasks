import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs animate-pulse space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-slate-200 rounded-md" />
          <div className="h-4 w-40 bg-slate-100 rounded-md" />
        </div>
        <div className="h-8 w-20 bg-slate-200 rounded-lg" />
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
          >
            <div className="space-y-2">
              <div className="h-4 w-48 bg-slate-200 rounded-md" />
              <div className="h-3 w-28 bg-slate-100 rounded-md" />
            </div>
            <div className="h-5 w-24 bg-slate-200 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FilterSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-slate-200 rounded-lg" />
      <div className="space-y-3">
        <div className="h-4 w-24 bg-slate-200 rounded-md" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 w-32 bg-slate-100 rounded-md" />
              <div className="h-4 w-8 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
