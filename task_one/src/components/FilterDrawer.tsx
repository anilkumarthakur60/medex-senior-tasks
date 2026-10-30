'use client';

import React, { useState } from 'react';
import {
  FilterState,
  Category,
  Provider,
  Service,
} from '../types';
import { FilterPanel } from './FilterPanel';
import { computeFacetCounts } from '../lib/filterEngine';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  visibleServices: Service[];
  providersMap: Map<number, Provider>;
  categoriesMap: Map<string, Category>;
  categories: Category[];
  providers: Provider[];
  availableCurrencies: string[];
  cities: string[];
  countries: string[];
}

export function FilterDrawer({
  isOpen,
  onClose,
  currentFilters,
  onApplyFilters,
  visibleServices,
  providersMap,
  categoriesMap,
  categories,
  providers,
  availableCurrencies,
  cities,
  countries,
}: FilterDrawerProps) {
  // Pending filter state while drawer is open
  const [pendingFilters, setPendingFilters] = useState<FilterState>(currentFilters);
  const [prevOpen, setPrevOpen] = useState(isOpen);

  // Sync with current filters when drawer transitions to open (React 19 pattern without effect)
  if (isOpen && !prevOpen) {
    setPrevOpen(true);
    setPendingFilters(currentFilters);
  } else if (!isOpen && prevOpen) {
    setPrevOpen(false);
  }

  // Compute live facet counts for pending selection
  const pendingFacetCounts = computeFacetCounts(
    visibleServices,
    providersMap,
    categoriesMap,
    pendingFilters
  );

  const handlePendingFilterChange = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setPendingFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetPending = () => {
    setPendingFilters({
      search: '',
      types: [],
      categoryId: null,
      subCategoryId: null,
      providerIds: [],
      city: null,
      country: null,
      currency: null,
      minPrice: null,
      maxPrice: null,
      testAtHomeOnly: false,
      sort: pendingFilters.sort,
    });
  };

  const handleApply = () => {
    onApplyFilters(pendingFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-xs md:hidden">
      <div className="flex-1 overflow-y-auto bg-slate-50 p-5 mt-12 rounded-t-2xl shadow-2xl flex flex-col">
        {/* Drawer header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Filter Services</h2>
            <p className="text-xs text-slate-500">
              Refine your selection across providers and categories
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100"
            aria-label="Close filter drawer"
          >
            ✕
          </button>
        </div>

        {/* Filter Content */}
        <div className="py-4 flex-1">
          <FilterPanel
            filters={pendingFilters}
            onFilterChange={handlePendingFilterChange}
            onResetFilters={handleResetPending}
            facetCounts={pendingFacetCounts}
            categories={categories}
            providers={providers}
            availableCurrencies={availableCurrencies}
            cities={cities}
            countries={countries}
          />
        </div>

        {/* Sticky Apply Button displaying PENDING results count */}
        <div className="sticky bottom-0 -mx-5 -mb-5 p-4 bg-white border-t border-slate-200 shadow-lg flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-2 py-3 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Show {pendingFacetCounts.totalCount} results</span>
          </button>
        </div>
      </div>
    </div>
  );
}
