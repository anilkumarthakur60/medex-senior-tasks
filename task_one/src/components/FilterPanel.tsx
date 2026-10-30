'use client';

import React, { useState } from 'react';
import {
  FilterState,
  FacetCounts,
  Category,
  Provider,
  ServiceType,
} from '../types';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onResetFilters: () => void;
  facetCounts: FacetCounts;
  categories: Category[];
  providers: Provider[];
  availableCurrencies: string[];
  cities: string[];
  countries: string[];
}

const SERVICE_TYPE_NAMES: Record<ServiceType, string> = {
  package: 'Health Packages',
  lab_test: 'Lab Tests',
  wellness: 'Wellness Treatments',
  service: 'Clinical Services',
  insurance: 'Health Insurance',
};

export function FilterPanel({
  filters,
  onFilterChange,
  onResetFilters,
  facetCounts,
  categories,
  providers,
  availableCurrencies,
  cities,
  countries,
}: FilterPanelProps) {
  const [providerSearch, setProviderSearch] = useState('');

  // Selected top category
  const selectedCategory = categories.find((c) => c.id === filters.categoryId);

  // Filtered providers for provider search box
  const filteredProviders = providers
    .filter((p) => p.status === 'active')
    .filter((p) => p.name.toLowerCase().includes(providerSearch.toLowerCase()))
    .slice(0, 15);

  const toggleType = (type: ServiceType) => {
    const next = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFilterChange('types', next);
  };

  const toggleProvider = (id: number) => {
    const next = filters.providerIds.includes(id)
      ? filters.providerIds.filter((p) => p !== id)
      : [...filters.providerIds, id];
    onFilterChange('providerIds', next);
  };

  return (
    <aside className="space-y-6" aria-label="Filters">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span>Filters</span>
        </h2>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
        >
          Reset all
        </button>
      </div>

      {/* 1. Free-Text Search */}
      <div className="space-y-1.5">
        <label htmlFor="search-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Search Services
        </label>
        <div className="relative">
          <input
            id="search-input"
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="e.g. blood test, MRI, Bangkok..."
            className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 pl-9 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden transition-all"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange('search', '')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 text-xs"
              aria-label="Clear search text"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. Service Type Multi-Select with Live Counts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Service Type
          </span>
          {filters.types.length > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange('types', [])}
              className="text-[11px] text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          {(['package', 'lab_test', 'wellness', 'service', 'insurance'] as ServiceType[]).map(
            (type) => {
              const count = facetCounts.types[type] || 0;
              const isSelected = filters.types.includes(type);
              const isDisabled = count === 0 && !isSelected;

              return (
                <label
                  key={type}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                    isDisabled
                      ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-50'
                      : isSelected
                      ? 'bg-teal-50 text-teal-900 font-medium cursor-pointer'
                      : 'hover:bg-slate-100 text-slate-700 cursor-pointer'
                  }`}
                  title={
                    isDisabled
                      ? 'No services available matching current filters'
                      : `${count} services available`
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => toggleType(type)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="truncate">{SERVICE_TYPE_NAMES[type]}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      isSelected
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </label>
              );
            }
          )}
        </div>
      </div>

      {/* 3. Category & Subcategory Tree (uses IDs to disambiguate identical slugs like 'ultrasound') */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Category & Subcategory
          </span>
          {filters.categoryId && (
            <button
              type="button"
              onClick={() => {
                onFilterChange('categoryId', null);
                onFilterChange('subCategoryId', null);
              }}
              className="text-[11px] text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Top-Level Categories */}
        <select
          value={filters.categoryId || ''}
          onChange={(e) => {
            const val = e.target.value || null;
            onFilterChange('categoryId', val);
            onFilterChange('subCategoryId', null);
          }}
          className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden"
        >
          <option value="">All Categories ({categories.length})</option>
          {categories
            .filter((c) => c.status)
            .map((cat) => {
              const count = facetCounts.categories[cat.id] || 0;
              return (
                <option key={cat.id} value={cat.id}>
                  {cat.title} ({cat.type}) - {count} available
                </option>
              );
            })}
        </select>

        {/* Subcategories (only shown when category selected) */}
        {selectedCategory && selectedCategory.children && selectedCategory.children.length > 0 && (
          <div className="mt-2 pl-2 border-l-2 border-teal-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Subcategories in {selectedCategory.title}
            </span>
            <div className="space-y-1">
              {selectedCategory.children
                .filter((sub) => sub.status)
                .map((sub) => {
                  const count = facetCounts.subCategories[sub.id] || 0;
                  const isSelected = filters.subCategoryId === sub.id;
                  const isDisabled = count === 0 && !isSelected;

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() =>
                        onFilterChange('subCategoryId', isSelected ? null : sub.id)
                      }
                      className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors text-left ${
                        isDisabled
                          ? 'opacity-40 cursor-not-allowed text-slate-400'
                          : isSelected
                          ? 'bg-teal-600 text-white font-semibold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{sub.title}</span>
                      <span className="text-[10px] opacity-80 font-mono">
                        ({count})
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Price Range (strictly per-currency, no mixing) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Price Range
          </span>
          {(filters.currency || filters.minPrice !== null || filters.maxPrice !== null) && (
            <button
              type="button"
              onClick={() => {
                onFilterChange('currency', null);
                onFilterChange('minPrice', null);
                onFilterChange('maxPrice', null);
              }}
              className="text-[11px] text-slate-400 hover:text-slate-600"
            >
              Reset
            </button>
          )}
        </div>

        {/* Currency selection tabs */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-slate-500">
            Select Currency (cannot mix):
          </label>
          <div className="grid grid-cols-3 gap-1">
            {availableCurrencies.map((curr) => {
              const isSelected = filters.currency === curr;
              return (
                <button
                  key={curr}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      onFilterChange('currency', null);
                      onFilterChange('minPrice', null);
                      onFilterChange('maxPrice', null);
                    } else {
                      onFilterChange('currency', curr);
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-teal-700 border-teal-700 text-white shadow-xs'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {curr}
                </button>
              );
            })}
          </div>
        </div>

        {/* Min / Max inputs (active when currency is chosen) */}
        {filters.currency ? (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">Min ({filters.currency})</label>
              <input
                type="number"
                min="0"
                step="100"
                value={filters.minPrice ?? ''}
                onChange={(e) =>
                  onFilterChange(
                    'minPrice',
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                placeholder="0"
                className="w-full text-xs bg-white border border-slate-300 rounded-md px-2 py-1.5"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">Max ({filters.currency})</label>
              <input
                type="number"
                min="0"
                step="100"
                value={filters.maxPrice ?? ''}
                onChange={(e) =>
                  onFilterChange(
                    'maxPrice',
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                placeholder="No limit"
                className="w-full text-xs bg-white border border-slate-300 rounded-md px-2 py-1.5"
              />
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 italic">
            Select a currency above to filter by price range without cross-currency conversion.
          </p>
        )}
      </div>

      {/* 5. Location: City / Country */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Location
          </span>
          {(filters.city || filters.country) && (
            <button
              type="button"
              onClick={() => {
                onFilterChange('city', null);
                onFilterChange('country', null);
              }}
              className="text-[11px] text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        <div className="space-y-2">
          {/* Country */}
          <select
            value={filters.country || ''}
            onChange={(e) => {
              onFilterChange('country', e.target.value || null);
              onFilterChange('city', null);
            }}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c} ({facetCounts.countries[c] || 0})
              </option>
            ))}
          </select>

          {/* City */}
          <select
            value={filters.city || ''}
            onChange={(e) => onFilterChange('city', e.target.value || null)}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city} ({facetCounts.cities[city] || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 6. Home Test Toggle */}
      <div className="pt-2 border-t border-slate-200">
        <label className="flex items-center justify-between cursor-pointer py-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.testAtHomeOnly}
              onChange={(e) => onFilterChange('testAtHomeOnly', e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-700">
              Available as home test
            </span>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {facetCounts.testAtHome.homeTest}
          </span>
        </label>
      </div>

      {/* 7. Providers Multi-Select */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Healthcare Providers
          </span>
          {filters.providerIds.length > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange('providerIds', [])}
              className="text-[11px] text-slate-400 hover:text-slate-600"
            >
              Clear ({filters.providerIds.length})
            </button>
          )}
        </div>

        <input
          type="text"
          value={providerSearch}
          onChange={(e) => setProviderSearch(e.target.value)}
          placeholder="Filter providers..."
          className="w-full text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800"
        />

        <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
          {filteredProviders.map((prov) => {
            const count = facetCounts.providers[prov.id] || 0;
            const isSelected = filters.providerIds.includes(prov.id);
            const isDisabled = count === 0 && !isSelected;

            return (
              <label
                key={prov.id}
                className={`flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                    : isSelected
                    ? 'bg-teal-50 text-teal-900 font-medium'
                    : 'hover:bg-slate-100 text-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => toggleProvider(prov.id)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="truncate">{prov.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  ({count})
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
