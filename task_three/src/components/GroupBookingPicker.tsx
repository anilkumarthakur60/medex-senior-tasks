import React from 'react';

interface GroupBookingPickerProps {
  numberOfPeople: number;
  onChangeNumberOfPeople: (count: number) => void;
}

export function GroupBookingPicker({
  numberOfPeople,
  onChangeNumberOfPeople,
}: GroupBookingPickerProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Party Size (Group Booking)
          </label>
          <p className="text-[11px] text-slate-500">
            Consecutive appointment slots booked with the same specialist
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {[1, 2, 3, 4].map((count) => {
            const isSelected = numberOfPeople === count;
            return (
              <button
                key={count}
                type="button"
                onClick={() => onChangeNumberOfPeople(count)}
                className={`w-8 h-8 rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {count}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
