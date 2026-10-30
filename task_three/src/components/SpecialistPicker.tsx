import React from 'react';
import { Specialist } from '../types';

interface SpecialistPickerProps {
  specialists: Specialist[];
  selectedSpecialistId: string;
  onSelectSpecialist: (id: string) => void;
}

export function SpecialistPicker({
  specialists,
  selectedSpecialistId,
  onSelectSpecialist,
}: SpecialistPickerProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
        Select Medical Specialist
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {specialists.map((spec) => {
          const isSelected = selectedSpecialistId === spec.id;
          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => onSelectSpecialist(spec.id)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-50/80 border-teal-500 shadow-xs ring-1 ring-teal-500'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 truncate">
                  {spec.name}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                )}
              </div>

              <div className="text-xs font-semibold text-teal-700 mt-0.5">
                {spec.speciality}
              </div>

              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5 border-t border-slate-100 pt-1.5 font-mono">
                <div>Hours: {spec.consultation.startTime} – {spec.consultation.endTime}</div>
                <div>
                  Slot: {spec.consultation.durationInMinutes}m + {spec.consultation.bufferInMinutes}m buffer
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
