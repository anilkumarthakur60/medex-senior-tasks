import React from 'react';
import { Service, Category } from '../types';
import { calculateServicePrice } from '../lib/priceCalc';
import { PriceDisplay } from './PriceDisplay';

interface ServiceCardProps {
  service: Service;
  currency: string;
  category?: Category;
  subCategory?: Category;
}

const TYPE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  package: { label: 'Package', bg: 'bg-blue-50', text: 'text-blue-700' },
  lab_test: { label: 'Lab Test', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  wellness: { label: 'Wellness', bg: 'bg-purple-50', text: 'text-purple-700' },
  service: { label: 'Clinical Service', bg: 'bg-amber-50', text: 'text-amber-700' },
  insurance: { label: 'Insurance', bg: 'bg-indigo-50', text: 'text-indigo-700' },
};

export function ServiceCard({ service, currency, category, subCategory }: ServiceCardProps) {
  const priceInfo = calculateServicePrice(service, currency);
  const typeBadge = TYPE_LABELS[service.type] || {
    label: service.type,
    bg: 'bg-slate-50',
    text: 'text-slate-700',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-200 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeBadge.bg} ${typeBadge.text}`}
          >
            {typeBadge.label}
          </span>
          {service.testAtHome && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home Test Available
            </span>
          )}
          {category && (
            <span className="text-xs text-slate-500">
              {category.title}
              {subCategory && ` › ${subCategory.title}`}
            </span>
          )}
        </div>
        <h4 className="text-sm font-semibold text-slate-900 truncate">
          {service.title}
        </h4>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
        <PriceDisplay priceInfo={priceInfo} />
      </div>
    </div>
  );
}
