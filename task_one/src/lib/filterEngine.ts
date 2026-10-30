import {
  Service,
  Provider,
  Category,
  FilterState,
  FacetCounts,
  ProviderGroup,
} from '../types';
import { calculateServicePrice } from './priceCalc';

/**
 * Checks if a service is visible per business rules:
 * - service.status === true
 * - provider.status === "active"
 * - category (if set) has status === true
 */
export function isServiceVisible(
  service: Service,
  providerMap: Map<number, Provider>,
  categoryMap: Map<string, Category>
): boolean {
  if (!service.status) return false;

  const provider = providerMap.get(service.userId);
  if (!provider || provider.status !== 'active') return false;

  if (service.categoryId) {
    const category = categoryMap.get(service.categoryId);
    if (category && !category.status) return false;
  }

  return true;
}

/**
 * Computes relevance score for free-text search and sorting.
 */
export function computeRelevanceScore(
  service: Service,
  provider: Provider | undefined,
  category: Category | undefined,
  searchTerms: string[]
): number {
  let score = 0;

  if (searchTerms.length > 0) {
    const titleLower = service.title.toLowerCase();
    const providerLower = provider ? provider.name.toLowerCase() : '';
    const categoryLower = category ? category.title.toLowerCase() : '';

    for (const term of searchTerms) {
      if (titleLower.includes(term)) {
        score += 10;
        if (titleLower.startsWith(term)) score += 5;
      }
      if (providerLower.includes(term)) {
        score += 6;
      }
      if (categoryLower.includes(term)) {
        score += 4;
      }
    }
  } else {
    score = 1;
  }

  // Provider rating boost (0 to 5 points)
  if (provider?.providerInformation.rating) {
    score += provider.providerInformation.rating;
  }

  return score;
}

/**
 * Filter predicate helper that can ignore a specific dimension for facet count computation.
 */
function matchesFilters(
  service: Service,
  provider: Provider | undefined,
  category: Category | undefined,
  filters: FilterState,
  optionsToIgnore: Partial<Record<keyof FilterState, boolean>> = {}
): boolean {
  // Service Type
  if (!optionsToIgnore.types && filters.types.length > 0) {
    if (!filters.types.includes(service.type)) return false;
  }

  // Category (by ID, avoiding slug collision!)
  if (!optionsToIgnore.categoryId && filters.categoryId) {
    if (service.categoryId !== filters.categoryId) return false;
  }

  // SubCategory (by ID)
  if (!optionsToIgnore.subCategoryId && filters.subCategoryId) {
    if (service.subCategoryId !== filters.subCategoryId) return false;
  }

  // Provider
  if (!optionsToIgnore.providerIds && filters.providerIds.length > 0) {
    if (!filters.providerIds.includes(service.userId)) return false;
  }

  // City / Country
  if (provider) {
    const providerCity = provider.providerInformation.city?.name;
    const providerCountry = provider.providerInformation.country?.name;

    if (!optionsToIgnore.city && filters.city) {
      if (!providerCity || providerCity.toLowerCase() !== filters.city.toLowerCase()) {
        return false;
      }
    }

    if (!optionsToIgnore.country && filters.country) {
      if (!providerCountry || providerCountry.toLowerCase() !== filters.country.toLowerCase()) {
        return false;
      }
    }

    // Price range (only within selected currency to never mix currencies)
    const providerCurrency = provider.providerInformation.currency;
    if (filters.currency) {
      if (providerCurrency !== filters.currency) {
        // When currency filter is active, exclude other currencies
        return false;
      }

      if (!optionsToIgnore.minPrice || !optionsToIgnore.maxPrice) {
        const priceBreakdown = calculateServicePrice(service, providerCurrency);
        const effectivePrice = priceBreakdown.finalPrice;

        if (filters.minPrice !== null && effectivePrice < filters.minPrice) return false;
        if (filters.maxPrice !== null && effectivePrice > filters.maxPrice) return false;
      }
    }
  }

  // Home test
  if (!optionsToIgnore.testAtHomeOnly && filters.testAtHomeOnly) {
    if (!service.testAtHome) return false;
  }

  // Search
  if (!optionsToIgnore.search && filters.search.trim()) {
    const terms = filters.search.toLowerCase().trim().split(/\s+/);
    const titleLower = service.title.toLowerCase();
    const providerLower = provider ? provider.name.toLowerCase() : '';
    const categoryLower = category ? category.title.toLowerCase() : '';

    const matchesAll = terms.every(
      (term) =>
        titleLower.includes(term) ||
        providerLower.includes(term) ||
        categoryLower.includes(term)
    );
    if (!matchesAll) return false;
  }

  return true;
}

/**
 * Computes live facet counts for all filter dimensions.
 * For each dimension, evaluates services matching all OTHER active filters.
 */
export function computeFacetCounts(
  visibleServices: Service[],
  providersMap: Map<number, Provider>,
  categoriesMap: Map<string, Category>,
  filters: FilterState
): FacetCounts {
  const counts: FacetCounts = {
    types: {},
    categories: {},
    subCategories: {},
    providers: {},
    cities: {},
    countries: {},
    testAtHome: { homeTest: 0, clinicOnly: 0 },
    totalCount: 0,
  };

  // Pre-filter services for each dimension
  for (const service of visibleServices) {
    const provider = providersMap.get(service.userId);
    const category = service.categoryId ? categoriesMap.get(service.categoryId) : undefined;

    // Base match with all filters active
    const isFullMatch = matchesFilters(service, provider, category, filters);
    if (isFullMatch) {
      counts.totalCount++;
    }

    // Types facet (ignore types filter)
    if (matchesFilters(service, provider, category, filters, { types: true })) {
      counts.types[service.type] = (counts.types[service.type] || 0) + 1;
    }

    // Categories facet (ignore category & subcategory filters)
    if (
      matchesFilters(service, provider, category, filters, {
        categoryId: true,
        subCategoryId: true,
      })
    ) {
      if (service.categoryId) {
        counts.categories[service.categoryId] =
          (counts.categories[service.categoryId] || 0) + 1;
      }
    }

    // SubCategories facet (active within current category, ignoring subcategory filter)
    if (
      matchesFilters(service, provider, category, filters, { subCategoryId: true })
    ) {
      if (service.subCategoryId) {
        counts.subCategories[service.subCategoryId] =
          (counts.subCategories[service.subCategoryId] || 0) + 1;
      }
    }

    // Providers facet (ignore provider filter)
    if (matchesFilters(service, provider, category, filters, { providerIds: true })) {
      counts.providers[service.userId] = (counts.providers[service.userId] || 0) + 1;
    }

    // Location facet (ignore city and country)
    if (matchesFilters(service, provider, category, filters, { city: true, country: true })) {
      if (provider?.providerInformation.city?.name) {
        const city = provider.providerInformation.city.name;
        counts.cities[city] = (counts.cities[city] || 0) + 1;
      }
      if (provider?.providerInformation.country?.name) {
        const country = provider.providerInformation.country.name;
        counts.countries[country] = (counts.countries[country] || 0) + 1;
      }
    }

    // Home test facet (ignore testAtHome filter)
    if (matchesFilters(service, provider, category, filters, { testAtHomeOnly: true })) {
      if (service.testAtHome) {
        counts.testAtHome.homeTest++;
      } else {
        counts.testAtHome.clinicOnly++;
      }
    }
  }

  return counts;
}

/**
 * Filter, sort, and group services by provider.
 */
export function filterAndGroupServices(
  visibleServices: Service[],
  providersMap: Map<number, Provider>,
  categoriesMap: Map<string, Category>,
  filters: FilterState,
  expandedProviderIds: Set<number>
): {
  groups: ProviderGroup[];
  totalMatchingServices: number;
} {
  const searchTerms = filters.search.trim().toLowerCase().split(/\s+/).filter(Boolean);

  // 1. Filter matching services
  const matching = visibleServices.filter((service) => {
    const provider = providersMap.get(service.userId);
    const category = service.categoryId ? categoriesMap.get(service.categoryId) : undefined;
    return matchesFilters(service, provider, category, filters);
  });

  // 2. Group by provider
  const groupedMap = new Map<number, Service[]>();
  for (const s of matching) {
    const list = groupedMap.get(s.userId) || [];
    list.push(s);
    groupedMap.set(s.userId, list);
  }

  // 3. Build ProviderGroups
  const groups: ProviderGroup[] = [];
  for (const [providerId, services] of groupedMap.entries()) {
    const provider = providersMap.get(providerId);
    if (!provider) continue;

    const currency = provider.providerInformation.currency;

    // Sort services inside each provider
    services.sort((a, b) => {
      const priceA = calculateServicePrice(a, currency).finalPrice;
      const priceB = calculateServicePrice(b, currency).finalPrice;
      if (filters.sort === 'price_asc') return priceA - priceB;
      if (filters.sort === 'price_desc') return priceB - priceA;
      return a.title.localeCompare(b.title);
    });

    const isExpanded = expandedProviderIds.has(providerId);
    const displayedServices = isExpanded ? services : services.slice(0, 3);

    const minPrice =
      services.length > 0
        ? Math.min(...services.map((s) => calculateServicePrice(s, currency).finalPrice))
        : 0;

    groups.push({
      provider,
      services,
      totalMatching: services.length,
      displayedServices,
      minPrice,
      currency,
    });
  }

  // 4. Sort provider groups
  groups.sort((a, b) => {
    if (filters.sort === 'rating') {
      const ratingA = a.provider.providerInformation.rating ?? -1;
      const ratingB = b.provider.providerInformation.rating ?? -1;
      if (ratingB !== ratingA) return ratingB - ratingA;
      return (b.provider.providerInformation.reviewCount || 0) - (a.provider.providerInformation.reviewCount || 0);
    }

    if (filters.sort === 'price_asc') {
      // If same currency, compare min price
      if (a.currency === b.currency) {
        return (a.minPrice ?? 0) - (b.minPrice ?? 0);
      }
      return a.currency.localeCompare(b.currency);
    }

    if (filters.sort === 'price_desc') {
      if (a.currency === b.currency) {
        return (b.minPrice ?? 0) - (a.minPrice ?? 0);
      }
      return a.currency.localeCompare(b.currency);
    }

    // Default: relevance
    if (searchTerms.length > 0) {
      // Compare highest score of service in group
      const scoreA = Math.max(
        ...a.services.map((s) =>
          computeRelevanceScore(
            s,
            a.provider,
            s.categoryId ? categoriesMap.get(s.categoryId) : undefined,
            searchTerms
          )
        )
      );
      const scoreB = Math.max(
        ...b.services.map((s) =>
          computeRelevanceScore(
            s,
            b.provider,
            s.categoryId ? categoriesMap.get(s.categoryId) : undefined,
            searchTerms
          )
        )
      );
      if (scoreB !== scoreA) return scoreB - scoreA;
    }

    // Secondary sort: rating desc
    const ratingA = a.provider.providerInformation.rating ?? 0;
    const ratingB = b.provider.providerInformation.rating ?? 0;
    if (ratingB !== ratingA) return ratingB - ratingA;

    return a.provider.name.localeCompare(b.provider.name);
  });

  return {
    groups,
    totalMatchingServices: matching.length,
  };
}
