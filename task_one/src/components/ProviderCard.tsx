import React from 'react';
import { ProviderGroup, Category } from '../types';
import { ServiceCard } from './ServiceCard';

interface ProviderCardProps {
  group: ProviderGroup;
  categoriesMap: Map<string, Category>;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function ProviderCard({
  group,
  categoriesMap,
  isExpanded,
  onToggleExpand,
}: ProviderCardProps) {
  const { provider, totalMatching, displayedServices, currency } = group;
  const info = provider.providerInformation;

  return (
    <article className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-shadow hover:shadow-md">
      {/* Provider Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-slate-900">{provider.name}</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {currency}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {info.city?.name}, {info.country?.name}
            </span>

            <span>•</span>

            <span className="text-xs text-slate-500">
              {info.types.map((t) => t.replace('_', ' ')).join(', ')}
            </span>
          </div>
        </div>

        {/* Rating or New badge */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {info.rating !== null ? (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/70 px-2.5 py-1.5 rounded-lg">
              <svg className="w-4 h-4 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-bold text-slate-800 text-sm">
                {info.rating.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500">
                ({info.reviewCount.toLocaleString()})
              </span>
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
              New Provider · No rating
            </span>
          )}
        </div>
      </div>

      {/* Services List (Max 3, or all when expanded) */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          <span>
            Matching Services ({totalMatching})
          </span>
          {group.minPrice !== undefined && group.minPrice > 0 && (
            <span className="normal-case font-normal text-slate-500">
              Starts at <strong className="font-semibold text-slate-700">{currency} {group.minPrice.toLocaleString()}</strong>
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {displayedServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              currency={currency}
              category={service.categoryId ? categoriesMap.get(service.categoryId) : undefined}
              subCategory={service.subCategoryId ? categoriesMap.get(service.subCategoryId) : undefined}
            />
          ))}
        </div>

        {/* View all toggle button */}
        {totalMatching > 3 && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onToggleExpand}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100/80 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <span>Show fewer services</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span>View all {totalMatching} services from this provider</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
