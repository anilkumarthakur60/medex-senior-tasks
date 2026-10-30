'use client';

import React from 'react';
import { BookingConfirmation } from '../types';
import { formatDualTime } from '../lib/timezone';

interface ConfirmationModalProps {
  confirmation: BookingConfirmation;
  providerName: string;
  specialistName: string;
  customerTz: string;
  onClose: () => void;
  isReschedule?: boolean;
  oldDetails?: {
    date: string;
    time: string;
  };
}

export function ConfirmationModal({
  confirmation,
  providerName,
  specialistName,
  customerTz,
  onClose,
  isReschedule = false,
  oldDetails,
}: ConfirmationModalProps) {
  const dual = formatDualTime(
    confirmation.date,
    confirmation.startTime,
    confirmation.providerTimezone,
    customerTz
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-xl font-bold">
            ✓
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {isReschedule ? 'Appointment Successfully Rescheduled!' : 'Appointment Confirmed!'}
          </h3>
          <p className="text-xs text-slate-500">
            Booking ID: <strong className="font-mono text-slate-700">{confirmation.bookingId}</strong>
          </p>
        </div>

        {/* Reschedule Comparison Box if applicable */}
        {isReschedule && oldDetails && (
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs space-y-1">
            <span className="font-bold text-blue-900 block">Schedule Modification:</span>
            <div className="flex items-center justify-between text-slate-700">
              <span className="line-through text-slate-400">
                Was: {oldDetails.date} at {oldDetails.time}
              </span>
              <span className="font-bold text-blue-700">
                → New: {confirmation.date} at {confirmation.startTime}
              </span>
            </div>
          </div>
        )}

        {/* Dual Clock Summary */}
        <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
            <span className="text-slate-500">Facility:</span>
            <span className="font-bold text-slate-800">{providerName}</span>
          </div>

          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
            <span className="text-slate-500">Specialist:</span>
            <span className="font-bold text-slate-800">{specialistName}</span>
          </div>

          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
            <span className="text-slate-500">Party Size:</span>
            <span className="font-bold text-slate-800">
              {confirmation.numberOfPeople} {confirmation.numberOfPeople === 1 ? 'Person' : 'People'}
            </span>
          </div>

          {/* Provider clock */}
          <div className="flex justify-between items-start text-xs pt-1">
            <span className="text-teal-800 font-semibold">1. Hospital Time:</span>
            <div className="text-right font-mono">
              <div className="font-bold text-slate-900">
                {dual.providerTime} – {confirmation.endTime}
              </div>
              <div className="text-[10px] text-slate-500">{dual.providerDate}</div>
            </div>
          </div>

          {/* Customer clock */}
          <div className="flex justify-between items-start text-xs pt-1">
            <span className="text-indigo-800 font-semibold">2. Your Local Time:</span>
            <div className="text-right font-mono">
              <div className="font-bold text-indigo-950">{dual.customerTime}</div>
              <div className="text-[10px] text-slate-500">{dual.customerDate}</div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
