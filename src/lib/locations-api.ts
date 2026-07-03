/**
 * Costa Rica location cascade — thin adapter over @chepelcr/tsuru-storefront-sdk.
 *
 * The SDK owns the signed data-be location routes; this module keeps the
 * template's existing export surface (getStates/getCounties/... + types) so the
 * cart/checkout components stay unchanged.
 */
import {
  createStorefrontClient,
  type StateRow,
  type CountyRow,
  type DistrictRow,
  type NeighborhoodRow,
} from '@chepelcr/tsuru-storefront-sdk';

/** ISO numeric country code for Costa Rica (Hacienda catalog). */
export const COSTA_RICA_ISO = '188';

export type StateResponse = StateRow;
export type CountyResponse = CountyRow;
export type DistrictResponse = DistrictRow;
export type NeighborhoodResponse = NeighborhoodRow;

/** Structured CR address carried on the order payload (matches store-be `sale`). */
export interface StructuredAddress {
  state_id: number | null;
  county_id: number | null;
  district_id: number | null;
  neighborhood_id: number | null;
  address: string;
}

const REGION = (import.meta.env.VITE_AWS_REGION as string | undefined) ?? 'us-east-1';
const HOST = import.meta.env.VITE_PUBLIC_API_URL as string | undefined;

// Locations are global (not org-scoped); a minimal client is enough.
const client = createStorefrontClient({ config: { mode: 'prod' }, host: HOST, region: REGION });

export function getStates(iso: string = COSTA_RICA_ISO): Promise<StateResponse[]> {
  return client.getStates(iso);
}

export function getCounties(stateId: number, iso: string = COSTA_RICA_ISO): Promise<CountyResponse[]> {
  return client.getCounties(stateId, iso);
}

export function getDistricts(
  stateId: number,
  countyId: number,
  iso: string = COSTA_RICA_ISO,
): Promise<DistrictResponse[]> {
  return client.getDistricts(stateId, countyId, iso);
}

export function getNeighborhoods(
  stateId: number,
  countyId: number,
  districtId: number,
  iso: string = COSTA_RICA_ISO,
): Promise<NeighborhoodResponse[]> {
  return client.getNeighborhoods(stateId, countyId, districtId, iso);
}
