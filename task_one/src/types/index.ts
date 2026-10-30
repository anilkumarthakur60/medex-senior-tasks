export type ServiceType = 'package' | 'lab_test' | 'wellness' | 'service' | 'insurance';

export interface Category {
  id: string;
  title: string;
  slug: string;
  type: ServiceType;
  position: number;
  status: boolean;
  parentId: string | null;
  children?: Category[];
}

export interface City {
  id: string;
  name: string;
  slug: string;
}

export interface Country {
  id: number;
  name: string;
  alphaCode: string;
}

export interface ProviderInformation {
  companyName: string;
  slug: string;
  types: ServiceType[];
  currency: 'THB' | 'NPR' | 'INR' | string;
  city: City;
  country: Country;
  rating: number | null;
  reviewCount: number;
}

export interface Provider {
  id: number;
  name: string;
  username: string;
  status: 'active' | 'inactive';
  providerInformation: ProviderInformation;
}

export interface WellnessPriceOption {
  id: string;
  durationInMinutes: number;
  price: string;
  discount: string;
  discountType: 'percent' | 'amount';
  serviceCharge: string;
  serviceChargeType: 'percent' | 'amount';
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  type: ServiceType;
  userId: number; // provider ID
  categoryId: string | null;
  subCategoryId: string | null;
  price: string | null;
  discount: string | null;
  discountType: 'percent' | 'amount' | null;
  serviceCharge: string | null;
  serviceChargeType: 'percent' | 'amount' | null;
  status: boolean;
  testAtHome: boolean;
  homeTestCharge: string | null;
  wellnessPricing: WellnessPriceOption[];
  createdAt: string;
}

export interface PriceBreakdown {
  originalPrice: number;
  discountAmount: number;
  afterDiscount: number;
  chargeAmount: number;
  finalPrice: number;
  hasDiscount: boolean;
  hasServiceCharge: boolean;
  isWellness: boolean;
  minPrice?: number;
  maxPrice?: number;
  currency: string;
}

export interface FilterState {
  search: string;
  types: ServiceType[];
  categoryId: string | null;
  subCategoryId: string | null;
  providerIds: number[];
  city: string | null;
  country: string | null;
  currency: string | null; // Selected currency for price filter
  minPrice: number | null;
  maxPrice: number | null;
  testAtHomeOnly: boolean;
  sort: 'relevance' | 'price_asc' | 'price_desc' | 'rating';
}

export interface FacetCounts {
  types: Record<string, number>;
  categories: Record<string, number>;
  subCategories: Record<string, number>;
  providers: Record<number, number>;
  cities: Record<string, number>;
  countries: Record<string, number>;
  testAtHome: {
    homeTest: number;
    clinicOnly: number;
  };
  totalCount: number;
}

export interface ProviderGroup {
  provider: Provider;
  services: Service[];
  totalMatching: number;
  displayedServices: Service[];
  minPrice?: number;
  currency: string;
}
