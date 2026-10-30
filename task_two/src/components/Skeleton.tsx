import React from 'react';

export function CartSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="h-6 w-44 bg-slate-200 rounded-md" />
            <div className="h-5 w-24 bg-slate-100 rounded-md" />
          </div>
          <div className="space-y-3">
            {[1, 2].map((j) => (
              <div key={j} className="h-16 bg-slate-50 rounded-lg border border-slate-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
