'use client';

import React, { useState, useMemo, useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useQueryState,
  parseAsString,
  parseAsArrayOf,
  parseAsInteger,
  parseAsFloat,
  parseAsBoolean,
  parseAsStringLiteral,
} from 'nuqs';

import {
  Category,
  Provider,
  Service,
  ServiceType,
  FilterState,
} from '../types';
import {
  isServiceVisible,
  computeFacetCounts,
  filterAndGroupServices,
} from '../lib/filterEngine';

import { FilterPanel } from './FilterPanel';
import { FilterDrawer } from './FilterDrawer';
import { ProviderCard } from './ProviderCard';
import { EmptyState } from './EmptyState';
import { CardSkeleton, FilterSkeleton } from './Skeleton';
import { DevPanel } from './DevPanel';

const SORT_OPTIONS = ['relevance', 'price_asc', 'price_desc', 'rating'] as const;

export function ServiceExplorer() {
  // --- Simulated API Controls ---
  const [simulatedDelay, setSimulatedDelay] = useState(300);
  const [simulatedFail, setSimulatedFail] = useState(false);

  // --- Mobile Drawer state ---
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // --- Expanded Providers set ---
  const [expandedProviders, setExpandedProviders] = useState<Set<number>>(new Set());

  // --- URL State via nuqs ---
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''));
  const [types, setTypes] = useQueryState(
    'type',
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [categoryId, setCategoryId] = useQueryState('cat', parseAsString);
  const [subCategoryId, setSubCategoryId] = useQueryState('subcat', parseAsString);
  const [providerIds, setProviderIds] = useQueryState(
    'p',
    parseAsArrayOf(parseAsInteger).withDefault([])
  );
  const [city, setCity] = useQueryState('city', parseAsString);
  const [country, setCountry] = useQueryState('country', parseAsString);
  const [currency, setCurrency] = useQueryState('curr', parseAsString);
  const [minPrice, setMinPrice] = useQueryState('min', parseAsFloat);
  const [maxPrice, setMaxPrice] = useQueryState('max', parseAsFloat);
  const [testAtHomeOnly, setTestAtHomeOnly] = useQueryState(
    'home',
    parseAsBoolean.withDefault(false)
  );
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsStringLiteral(SORT_OPTIONS).withDefault('relevance')
  );

  // Deferred search term to avoid blocking input during rapid keystrokes
  const deferredSearch = useDeferredValue(search);

  // Consolidated active filters object
  const activeFilters: FilterState = useMemo(
    () => ({
      search: deferredSearch,
      types: types as ServiceType[],
      categoryId,
      subCategoryId,
      providerIds,
      city,
      country,
      currency,
      minPrice,
      maxPrice,
      testAtHomeOnly,
      sort,
    }),
    [
      deferredSearch,
      types,
      categoryId,
      subCategoryId,
      providerIds,
      city,
      country,
      currency,
      minPrice,
      maxPrice,
      testAtHomeOnly,
      sort,
    ]
  );

  // --- Data Fetching via Mock APIs ---
  const categoriesQuery = useQuery<{ data: Category[] }>({
    queryKey: ['categories', simulatedDelay, simulatedFail],
    queryFn: async () => {
      const res = await fetch(
        `/api/categories?delay=${simulatedDelay}&fail=${simulatedFail ? 1 : 0}`
      );
      if (!res.ok) throw new Error('Failed to load categories');
      return res.json();
    },
  });

  const providersQuery = useQuery<{ data: Provider[] }>({
    queryKey: ['providers', simulatedDelay, simulatedFail],
    queryFn: async () => {
      const res = await fetch(
        `/api/providers?delay=${simulatedDelay}&fail=${simulatedFail ? 1 : 0}`
      );
      if (!res.ok) throw new Error('Failed to load providers');
      return res.json();
    },
  });

  const servicesQuery = useQuery<{ data: Service[] }>({
    queryKey: ['services', simulatedDelay, simulatedFail],
    queryFn: async () => {
      const res = await fetch(
        `/api/services?delay=${simulatedDelay}&fail=${simulatedFail ? 1 : 0}`
      );
      if (!res.ok) throw new Error('Failed to load services');
      return res.json();
    },
  });

  const isLoading =
    categoriesQuery.isLoading || providersQuery.isLoading || servicesQuery.isLoading;
  const isError =
    categoriesQuery.isError || providersQuery.isError || servicesQuery.isError;

  const handleRetry = () => {
    setSimulatedFail(false);
    categoriesQuery.refetch();
    providersQuery.refetch();
    servicesQuery.refetch();
  };

  // --- Maps & Fast Indexes ---
  const {
    rawServices,
    rawProviders,
    rawCategories,
    categoriesMap,
    providersMap,
    visibleServices,
    availableCurrencies,
    allCities,
    allCountries,
  } = useMemo(() => {
    const s = servicesQuery.data?.data || [];
    const p = providersQuery.data?.data || [];
    const c = categoriesQuery.data?.data || [];

    const pMap = new Map<number, Provider>();
    for (const prov of p) {
      pMap.set(prov.id, prov);
    }

    const cMap = new Map<string, Category>();
    for (const cat of c) {
      cMap.set(cat.id, cat);
      if (cat.children) {
        for (const child of cat.children) {
          cMap.set(child.id, child);
        }
      }
    }

    // Filter by visibility rules:
    // service.status === true AND provider.status === 'active' AND (no category OR category.status === true)
    const visible = s.filter((srv) => isServiceVisible(srv, pMap, cMap));

    // Currencies, cities, countries from active providers
    const currencies = Array.from(
      new Set(
        p
          .filter((prov) => prov.status === 'active')
          .map((prov) => prov.providerInformation.currency)
          .filter(Boolean)
      )
    ).sort();

    const cities = Array.from(
      new Set(
        p
          .filter((prov) => prov.status === 'active')
          .map((prov) => prov.providerInformation.city?.name)
          .filter(Boolean) as string[]
      )
    ).sort();

    const countries = Array.from(
      new Set(
        p
          .filter((prov) => prov.status === 'active')
          .map((prov) => prov.providerInformation.country?.name)
          .filter(Boolean) as string[]
      )
    ).sort();

    return {
      rawServices: s,
      rawProviders: p,
      rawCategories: c,
      categoriesMap: cMap,
      providersMap: pMap,
      visibleServices: visible,
      availableCurrencies: currencies,
      allCities: cities,
      allCountries: countries,
    };
  }, [categoriesQuery.data, providersQuery.data, servicesQuery.data]);

  // --- Compute Live Facets ---
  const facetCounts = useMemo(() => {
    if (visibleServices.length === 0) {
      return {
        types: {},
        categories: {},
        subCategories: {},
        providers: {},
        cities: {},
        countries: {},
        testAtHome: { homeTest: 0, clinicOnly: 0 },
        totalCount: 0,
      };
    }
    return computeFacetCounts(
      visibleServices,
      providersMap,
      categoriesMap,
      activeFilters
    );
  }, [visibleServices, providersMap, categoriesMap, activeFilters]);

  // --- Filter and Group Results ---
  const { groups, totalMatchingServices } = useMemo(() => {
    if (visibleServices.length === 0) {
      return { groups: [], totalMatchingServices: 0 };
    }
    return filterAndGroupServices(
      visibleServices,
      providersMap,
      categoriesMap,
      activeFilters,
      expandedProviders
    );
  }, [
    visibleServices,
    providersMap,
    categoriesMap,
    activeFilters,
    expandedProviders,
  ]);

  // --- Filter update handlers ---
  const handleFilterChange = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    switch (key) {
      case 'search':
        setSearch(value as string);
        break;
      case 'types':
        setTypes(value as string[]);
        break;
      case 'categoryId':
        setCategoryId(value as string | null);
        break;
      case 'subCategoryId':
        setSubCategoryId(value as string | null);
        break;
      case 'providerIds':
        setProviderIds(value as number[]);
        break;
      case 'city':
        setCity(value as string | null);
        break;
      case 'country':
        setCountry(value as string | null);
        break;
      case 'currency':
        setCurrency(value as string | null);
        break;
      case 'minPrice':
        setMinPrice(value as number | null);
        break;
      case 'maxPrice':
        setMaxPrice(value as number | null);
        break;
      case 'testAtHomeOnly':
        setTestAtHomeOnly(value as boolean);
        break;
      case 'sort':
        setSort(value as typeof SORT_OPTIONS[number]);
        break;
    }
  };

  const handleClearSingleFilter = (key: keyof FilterState) => {
    switch (key) {
      case 'search':
        setSearch('');
        break;
      case 'types':
        setTypes([]);
        break;
      case 'categoryId':
        setCategoryId(null);
        setSubCategoryId(null);
        break;
      case 'subCategoryId':
        setSubCategoryId(null);
        break;
      case 'providerIds':
        setProviderIds([]);
        break;
      case 'city':
        setCity(null);
        break;
      case 'country':
        setCountry(null);
        break;
      case 'currency':
        setCurrency(null);
        setMinPrice(null);
        setMaxPrice(null);
        break;
      case 'minPrice':
        setMinPrice(null);
        break;
      case 'maxPrice':
        setMaxPrice(null);
        break;
      case 'testAtHomeOnly':
        setTestAtHomeOnly(false);
        break;
    }
  };

  const handleResetAllFilters = () => {
    setSearch('');
    setTypes([]);
    setCategoryId(null);
    setSubCategoryId(null);
    setProviderIds([]);
    setCity(null);
    setCountry(null);
    setCurrency(null);
    setMinPrice(null);
    setMaxPrice(null);
    setTestAtHomeOnly(false);
  };

  const handleApplyAllDrawerFilters = (next: FilterState) => {
    setSearch(next.search);
    setTypes(next.types);
    setCategoryId(next.categoryId);
    setSubCategoryId(next.subCategoryId);
    setProviderIds(next.providerIds);
    setCity(next.city);
    setCountry(next.country);
    setCurrency(next.currency);
    setMinPrice(next.minPrice);
    setMaxPrice(next.maxPrice);
    setTestAtHomeOnly(next.testAtHomeOnly);
    setSort(next.sort);
  };

  const toggleProviderExpand = (providerId: number) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Screen Reader Announcement for Dynamic Filter Changes */}
      <div className="sr-only" role="status" aria-live="polite">
        {isLoading
          ? 'Loading services...'
          : `${totalMatchingServices} services found across ${groups.length} providers.`}
      </div>

      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black tracking-wider text-sm shadow-xs">
              M
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                MedEx <span className="text-teal-600 font-semibold">Explorer</span>
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Compare clinics, hospitals & health packages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filters ({totalMatchingServices})</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="sort-select" className="text-slate-500 hidden sm:inline">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) =>
                  handleFilterChange('sort', e.target.value as typeof SORT_OPTIONS[number])
                }
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden cursor-pointer"
              >
                <option value="relevance">Relevance</option>
                <option value="rating">Highest Rating</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar Filter Panel */}
        <div className="hidden md:block w-72 shrink-0">
          <div className="sticky top-22 bg-white rounded-xl border border-slate-200 p-5 shadow-xs max-h-[calc(100vh-6.5rem)] overflow-y-auto">
            {isLoading ? (
              <FilterSkeleton />
            ) : (
              <FilterPanel
                filters={activeFilters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetAllFilters}
                facetCounts={facetCounts}
                categories={rawCategories}
                providers={rawProviders}
                availableCurrencies={availableCurrencies}
                cities={allCities}
                countries={allCountries}
              />
            )}
          </div>
        </div>

        {/* Content Area */}
        <section className="flex-1 min-w-0 space-y-4" aria-label="Search results">
          {/* Result Count and Active Filters Bar */}
          <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {isLoading ? (
                  'Searching healthcare providers...'
                ) : (
                  <>
                    Showing <span className="text-teal-700 font-bold">{totalMatchingServices}</span> services across{' '}
                    <span className="text-teal-700 font-bold">{groups.length}</span> providers
                  </>
                )}
              </p>
              <p className="text-xs text-slate-500">
                Prices calculated with provider discounts and service charges included
              </p>
            </div>
          </div>

          {/* Error State with Retry Button */}
          {isError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center font-bold">
                !
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900">
                  Failed to load healthcare services
                </h3>
                <p className="text-xs text-rose-700 mt-1">
                  An error occurred connecting to the service explorer API.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Retry Request
              </button>
            </div>
          )}

          {/* Skeletons while loading */}
          {isLoading && (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && groups.length === 0 && (
            <EmptyState
              filters={activeFilters}
              onClearFilter={handleClearSingleFilter}
              onResetAll={handleResetAllFilters}
            />
          )}

          {/* Results List Grouped by Provider */}
          {!isLoading && !isError && groups.length > 0 && (
            <div className="space-y-4">
              {groups.map((group) => (
                <ProviderCard
                  key={group.provider.id}
                  group={group}
                  categoriesMap={categoriesMap}
                  isExpanded={expandedProviders.has(group.provider.id)}
                  onToggleExpand={() => toggleProviderExpand(group.provider.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Mobile Filter Drawer */}
      <FilterDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        currentFilters={activeFilters}
        onApplyFilters={handleApplyAllDrawerFilters}
        visibleServices={visibleServices}
        providersMap={providersMap}
        categoriesMap={categoriesMap}
        categories={rawCategories}
        providers={rawProviders}
        availableCurrencies={availableCurrencies}
        cities={allCities}
        countries={allCountries}
      />

      {/* Dev Latency & Failure Testing Panel */}
      <DevPanel
        delay={simulatedDelay}
        onDelayChange={setSimulatedDelay}
        fail={simulatedFail}
        onFailChange={setSimulatedFail}
        rawStats={{
          totalServices: rawServices.length,
          visibleServices: visibleServices.length,
          totalProviders: rawProviders.length,
          activeProviders: rawProviders.filter((p) => p.status === 'active').length,
        }}
      />
    </div>
  );
}
