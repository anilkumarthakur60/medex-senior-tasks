import React from 'react';
import { FilterState } from '../types';

interface EmptyStateProps {
  filters: FilterState;
  onClearFilter: (key: keyof FilterState) => void;
  onResetAll: () => void;
}

export function EmptyState({ filters, onClearFilter, onResetAll }: EmptyStateProps) {
  const activeSuggestions: { label: string; action: () => void }[] = [];

  if (filters.search) {
    activeSuggestions.push({
      label: `Clear search term "${filters.search}"`,
      action: () => onClearFilter('search'),
    });
  }

  if (filters.minPrice !== null || filters.maxPrice !== null) {
    activeSuggestions.push({
      label: 'Remove price range filter',
      action: () => {
        onClearFilter('minPrice');
        onClearFilter('maxPrice');
        onClearFilter('currency');
      },
    });
  }

  if (filters.types.length > 0) {
    activeSuggestions.push({
      label: `Clear service types (${filters.types.length})`,
      action: () => onClearFilter('types'),
    });
  }

  if (filters.categoryId) {
    activeSuggestions.push({
      label: 'Clear selected category',
      action: () => {
        onClearFilter('categoryId');
        onClearFilter('subCategoryId');
      },
    });
  }

  if (filters.providerIds.length > 0) {
    activeSuggestions.push({
      label: 'Clear provider filter',
      action: () => onClearFilter('providerIds'),
    });
  }

  if (filters.city || filters.country) {
    activeSuggestions.push({
      label: `Clear location filter (${filters.city || filters.country})`,
      action: () => {
        onClearFilter('city');
        onClearFilter('country');
      },
    });
  }

  if (filters.testAtHomeOnly) {
    activeSuggestions.push({
      label: 'Remove home test requirement',
      action: () => onClearFilter('testAtHomeOnly'),
    });
  }

  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center space-y-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">
          No matching healthcare services found
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          We couldn&apos;t find any services matching your active filter criteria. Try broadening your search or removing specific filters.
        </p>
      </div>

      {activeSuggestions.length > 0 && (
        <div className="pt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            Suggested adjustments:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
            {activeSuggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={sug.action}
                className="text-xs font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-full border border-teal-200 transition-colors cursor-pointer"
              >
                ✕ {sug.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2">
        <button
          type="button"
          onClick={onResetAll}
          className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-4 cursor-pointer"
        >
          Reset all filters to default
        </button>
      </div>
    </div>
  );
}
