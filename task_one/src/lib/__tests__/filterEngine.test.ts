import { describe, it, expect } from 'vitest';
import {
  isServiceVisible,
  computeFacetCounts,
  filterAndGroupServices,
} from '../filterEngine';
import { Service, Provider, Category, FilterState } from '../../types';

describe('filterEngine', () => {
  const activeProvider: Provider = {
    id: 1,
    name: 'Bangkok Central Hospital',
    username: 'bangkok-central',
    status: 'active',
    providerInformation: {
      companyName: 'Bangkok Central',
      slug: 'bangkok-central',
      types: ['package', 'lab_test'],
      currency: 'THB',
      city: { id: 'c1', name: 'Bangkok', slug: 'bangkok' },
      country: { id: 1, name: 'Thailand', alphaCode: 'TH' },
      rating: 4.8,
      reviewCount: 200,
    },
  };

  const inactiveProvider: Provider = {
    id: 2,
    name: 'Old Clinic',
    username: 'old-clinic',
    status: 'inactive',
    providerInformation: {
      companyName: 'Old Clinic',
      slug: 'old-clinic',
      types: ['service'],
      currency: 'THB',
      city: { id: 'c1', name: 'Bangkok', slug: 'bangkok' },
      country: { id: 1, name: 'Thailand', alphaCode: 'TH' },
      rating: 3.5,
      reviewCount: 10,
    },
  };

  const activeCategory: Category = {
    id: 'cat-package-ultrasound',
    title: 'Ultrasound',
    slug: 'ultrasound',
    type: 'package',
    position: 1,
    status: true,
    parentId: null,
  };

  const inactiveCategory: Category = {
    id: 'cat-inactive',
    title: 'Deprecated Category',
    slug: 'deprecated',
    type: 'package',
    position: 2,
    status: false,
    parentId: null,
  };

  const providersMap = new Map<number, Provider>([
    [1, activeProvider],
    [2, inactiveProvider],
  ]);

  const categoriesMap = new Map<string, Category>([
    ['cat-package-ultrasound', activeCategory],
    ['cat-inactive', inactiveCategory],
  ]);

  const baseService: Service = {
    id: 's1',
    title: 'Abdominal Ultrasound',
    slug: 'abdominal-ultrasound',
    type: 'package',
    userId: 1,
    categoryId: 'cat-package-ultrasound',
    subCategoryId: null,
    price: '3000.00',
    discount: '0.00',
    discountType: 'amount',
    serviceCharge: '0.00',
    serviceChargeType: 'amount',
    status: true,
    testAtHome: false,
    homeTestCharge: null,
    wellnessPricing: [],
    createdAt: '2025-01-01T00:00:00Z',
  };

  describe('isServiceVisible', () => {
    it('returns true when service, provider, and category are active', () => {
      expect(isServiceVisible(baseService, providersMap, categoriesMap)).toBe(true);
    });

    it('returns false when service status is false', () => {
      expect(
        isServiceVisible({ ...baseService, status: false }, providersMap, categoriesMap)
      ).toBe(false);
    });

    it('returns false when provider status is inactive', () => {
      expect(
        isServiceVisible({ ...baseService, userId: 2 }, providersMap, categoriesMap)
      ).toBe(false);
    });

    it('returns false when category status is false', () => {
      expect(
        isServiceVisible(
          { ...baseService, categoryId: 'cat-inactive' },
          providersMap,
          categoriesMap
        )
      ).toBe(false);
    });
  });

  describe('Category disambiguation with same slug (ultrasound)', () => {
    const labUltrasoundCategory: Category = {
      id: 'cat-lab-ultrasound',
      title: 'Ultrasound',
      slug: 'ultrasound',
      type: 'lab_test',
      position: 3,
      status: true,
      parentId: null,
    };

    const categoriesMapWithBoth = new Map<string, Category>([
      ['cat-package-ultrasound', activeCategory],
      ['cat-lab-ultrasound', labUltrasoundCategory],
    ]);

    const labService: Service = {
      ...baseService,
      id: 's2',
      type: 'lab_test',
      categoryId: 'cat-lab-ultrasound',
    };

    it('distinguishes package ultrasound from lab_test ultrasound by ID', () => {
      const filters: FilterState = {
        search: '',
        types: [],
        categoryId: 'cat-package-ultrasound',
        subCategoryId: null,
        providerIds: [],
        city: null,
        country: null,
        currency: null,
        minPrice: null,
        maxPrice: null,
        testAtHomeOnly: false,
        sort: 'relevance',
      };

      const result = filterAndGroupServices(
        [baseService, labService],
        providersMap,
        categoriesMapWithBoth,
        filters,
        new Set()
      );

      // Only package ultrasound should match
      expect(result.totalMatchingServices).toBe(1);
      expect(result.groups[0].services[0].id).toBe('s1');
    });
  });

  describe('computeFacetCounts', () => {
    it('computes correct facet counts when filters are applied', () => {
      const s1: Service = { ...baseService, id: 's1', type: 'package' };
      const s2: Service = { ...baseService, id: 's2', type: 'lab_test', testAtHome: true };

      const filters: FilterState = {
        search: '',
        types: ['package'],
        categoryId: null,
        subCategoryId: null,
        providerIds: [],
        city: null,
        country: null,
        currency: null,
        minPrice: null,
        maxPrice: null,
        testAtHomeOnly: false,
        sort: 'relevance',
      };

      const counts = computeFacetCounts(
        [s1, s2],
        providersMap,
        categoriesMap,
        filters
      );

      // Facet for types should reflect both because it ignores the types filter
      expect(counts.types['package']).toBe(1);
      expect(counts.types['lab_test']).toBe(1);
      // Total count strictly reflects active filters
      expect(counts.totalCount).toBe(1);
    });
  });
});
