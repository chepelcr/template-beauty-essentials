// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * Costa Rica location cascade for the checkout (provincia → cantón →
 * distrito → barrio), from data-be through the public API. The ids travel on
 * the order exactly like a POS order's address.
 */
import { useQuery } from '@tanstack/react-query';
import { locationsClient } from './sdk';

const DAY = 24 * 60 * 60 * 1000;

export interface PlaceOption {
  id: number;
  name: string;
}

const byName = (a: PlaceOption, b: PlaceOption) => a.name.localeCompare(b.name, 'es');

export function useProvincias() {
  return useQuery({
    queryKey: ['places', 'states'],
    staleTime: DAY,
    queryFn: async () =>
      (await locationsClient().getStates()).map((s) => ({ id: s.state_id, name: s.state_name })).sort(byName),
  });
}

export function useCantones(stateId: number | null) {
  return useQuery({
    queryKey: ['places', 'counties', stateId],
    enabled: stateId !== null,
    staleTime: DAY,
    queryFn: async () =>
      (await locationsClient().getCounties(stateId!)).map((c) => ({ id: c.county_id, name: c.county_name })).sort(byName),
  });
}

export function useDistritos(stateId: number | null, countyId: number | null) {
  return useQuery({
    queryKey: ['places', 'districts', stateId, countyId],
    enabled: stateId !== null && countyId !== null,
    staleTime: DAY,
    queryFn: async () =>
      (await locationsClient().getDistricts(stateId!, countyId!))
        .map((d) => ({ id: d.district_id, name: d.district_name }))
        .sort(byName),
  });
}

export function useBarrios(stateId: number | null, countyId: number | null, districtId: number | null) {
  return useQuery({
    queryKey: ['places', 'neighborhoods', stateId, countyId, districtId],
    enabled: stateId !== null && countyId !== null && districtId !== null,
    staleTime: DAY,
    queryFn: async () =>
      (await locationsClient().getNeighborhoods(stateId!, countyId!, districtId!))
        .map((n) => ({ id: n.neighborhood_id, name: n.neighborhood_name }))
        .sort(byName),
  });
}

export const placeName = (options: PlaceOption[] | undefined, id: number | null): string | null =>
  options?.find((o) => o.id === id)?.name ?? null;
