import type { FurnishingStatus, ListingPurpose, Property, PropertyImage, PropertyStatus, PropertyType } from '@prisma/client';

export interface PropertyImageDto {
  id: string;
  url: string;
  altText: string | null;
  position: number;
  isCover: boolean;
}

export interface PropertyDto {
  id: string;
  agentId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  purpose: ListingPurpose;
  price: number;
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  amenities: string[];
  furnishing: FurnishingStatus;
  parking: boolean;
  metroDistanceKm: number | null;
  address: string;
  locality: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  status: PropertyStatus;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
  images: PropertyImageDto[];
  pricePerSqFt: number;
}

export function toImageDto(image: PropertyImage): PropertyImageDto {
  return {
    id: image.id,
    url: image.url,
    altText: image.altText,
    position: image.position,
    isCover: image.isCover,
  };
}

export function toPropertyDto(property: Property & { images?: PropertyImage[] }): PropertyDto {
  const price = Number(property.price.toString());
  return {
    id: property.id,
    agentId: property.agentId,
    title: property.title,
    description: property.description,
    propertyType: property.propertyType,
    purpose: property.purpose,
    price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqFt: property.areaSqFt,
    amenities: property.amenities,
    furnishing: property.furnishing,
    parking: property.parking,
    metroDistanceKm: property.metroDistanceKm === null ? null : Number(property.metroDistanceKm.toString()),
    address: property.address,
    locality: property.locality,
    city: property.city,
    state: property.state,
    country: property.country,
    postalCode: property.postalCode,
    latitude: property.latitude === null ? null : Number(property.latitude.toString()),
    longitude: property.longitude === null ? null : Number(property.longitude.toString()),
    status: property.status,
    viewsCount: property.viewsCount,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
    images: (property.images ?? []).map(toImageDto),
    pricePerSqFt: Math.round((price / property.areaSqFt) * 100) / 100,
  };
}
