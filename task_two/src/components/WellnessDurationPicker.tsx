import React from 'react';
import { WellnessPriceOption } from '../types';

interface WellnessDurationPickerProps {
  options: WellnessPriceOption[];
  currency: string;
  selectedOptionId?: string | null;
  onSelectOption: (optionId: string) => void;
  disabled?: boolean;
}

export function WellnessDurationPicker({
  options,
  currency,
  selectedOptionId,
  onSelectOption,
  disabled = false,
}: WellnessDurationPickerProps) {
  return (
    <div className="mt-2.5 p-3 rounded-lg bg-purple-50/70 border border-purple-200/70 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Select Treatment Duration
        </span>
        {!selectedOptionId && (
          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
            Required for checkout
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectOption(opt.id)}
              className={`flex items-center justify-between p-2 rounded-lg text-xs border transition-all text-left ${
                isSelected
                  ? 'bg-purple-600 text-white border-purple-600 font-semibold shadow-xs'
                  : 'bg-white hover:bg-purple-50/50 text-slate-700 border-purple-200'
              } disabled:opacity-50 cursor-pointer`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-white bg-purple-600' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                </span>
                <span>{opt.durationInMinutes} Minutes</span>
              </div>
              <span className={`font-mono font-bold ${isSelected ? 'text-white' : 'text-purple-900'}`}>
                {currency} {opt.amount_after_service_charge.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
