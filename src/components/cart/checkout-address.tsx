import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COSTA_RICA_ISO,
  getStates,
  getCounties,
  getDistricts,
  getNeighborhoods,
  type StructuredAddress,
} from "@/lib/locations-api";

/**
 * Shared, reusable CR structured-address field for the storefront checkout.
 *
 * Renders the provincia → cantón → distrito → barrio cascade (sourced from the
 * public API location routes, mirroring the POS `LocationSelect`) plus a
 * free-text "dirección exacta". Emits the numeric ids on the value object
 * (`state_id`/`county_id`/`district_id`/`neighborhood_id` + `address`) so the
 * order payload matches the store-be `sale` structured-address fields.
 *
 * Resolved human-readable names are surfaced via `onNamesChange` so the caller
 * (e.g. the WhatsApp message) can show provincia/cantón/distrito/barrio labels.
 *
 * This component is copied identically into every storefront template.
 */

export interface AddressNames {
  state_name: string;
  county_name: string;
  district_name: string;
  neighborhood_name: string;
}

interface CheckoutAddressProps {
  value: StructuredAddress;
  onChange: (value: StructuredAddress) => void;
  onNamesChange?: (names: AddressNames) => void;
}

export default function CheckoutAddress({
  value,
  onChange,
  onNamesChange,
}: CheckoutAddressProps) {
  const { state_id, county_id, district_id, neighborhood_id } = value;

  const { data: states = [], isLoading: statesLoading } = useQuery({
    queryKey: ["cr-states"],
    queryFn: () => getStates(),
    staleTime: 60 * 60 * 1000,
  });

  const { data: counties = [], isLoading: countiesLoading } = useQuery({
    queryKey: ["cr-counties", state_id],
    queryFn: () => getCounties(state_id!),
    enabled: state_id != null,
    staleTime: 60 * 60 * 1000,
  });

  const { data: districts = [], isLoading: districtsLoading } = useQuery({
    queryKey: ["cr-districts", state_id, county_id],
    queryFn: () => getDistricts(state_id!, county_id!),
    enabled: state_id != null && county_id != null,
    staleTime: 60 * 60 * 1000,
  });

  const { data: neighborhoods = [], isLoading: nbLoading } = useQuery({
    queryKey: ["cr-neighborhoods", state_id, county_id, district_id],
    queryFn: () => getNeighborhoods(state_id!, county_id!, district_id!),
    enabled: state_id != null && county_id != null && district_id != null,
    staleTime: 60 * 60 * 1000,
  });

  const emitNames = (next: Partial<AddressNames>) => {
    if (!onNamesChange) return;
    onNamesChange({
      state_name:
        states.find((s) => s.state_id === state_id)?.state_name ?? "",
      county_name:
        counties.find((c) => c.county_id === county_id)?.county_name ?? "",
      district_name:
        districts.find((d) => d.district_id === district_id)?.district_name ??
        "",
      neighborhood_name:
        neighborhoods.find((n) => n.neighborhood_id === neighborhood_id)
          ?.neighborhood_name ?? "",
      ...next,
    });
  };

  const handleState = (raw: string) => {
    const id = raw ? parseInt(raw, 10) : null;
    onChange({
      state_id: id,
      county_id: null,
      district_id: null,
      neighborhood_id: null,
      address: value.address,
    });
    emitNames({
      state_name: states.find((s) => s.state_id === id)?.state_name ?? "",
      county_name: "",
      district_name: "",
      neighborhood_name: "",
    });
  };

  const handleCounty = (raw: string) => {
    const id = raw ? parseInt(raw, 10) : null;
    onChange({ ...value, county_id: id, district_id: null, neighborhood_id: null });
    emitNames({
      county_name: counties.find((c) => c.county_id === id)?.county_name ?? "",
      district_name: "",
      neighborhood_name: "",
    });
  };

  const handleDistrict = (raw: string) => {
    const id = raw ? parseInt(raw, 10) : null;
    onChange({ ...value, district_id: id, neighborhood_id: null });
    emitNames({
      district_name:
        districts.find((d) => d.district_id === id)?.district_name ?? "",
      neighborhood_name: "",
    });
  };

  const handleNeighborhood = (raw: string) => {
    const id = raw ? parseInt(raw, 10) : null;
    onChange({ ...value, neighborhood_id: id });
    emitNames({
      neighborhood_name:
        neighborhoods.find((n) => n.neighborhood_id === id)
          ?.neighborhood_name ?? "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="provincia">Provincia</Label>
          <Select
            value={state_id != null ? String(state_id) : ""}
            onValueChange={handleState}
            disabled={statesLoading}
          >
            <SelectTrigger id="provincia">
              <SelectValue
                placeholder={statesLoading ? "Cargando..." : "Selecciona provincia"}
              />
            </SelectTrigger>
            <SelectContent>
              {states.map((s) => (
                <SelectItem key={s.state_id} value={String(s.state_id)}>
                  {s.state_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="canton">Cantón</Label>
          <Select
            value={county_id != null ? String(county_id) : ""}
            onValueChange={handleCounty}
            disabled={state_id == null || countiesLoading}
          >
            <SelectTrigger id="canton">
              <SelectValue
                placeholder={countiesLoading ? "Cargando..." : "Selecciona cantón"}
              />
            </SelectTrigger>
            <SelectContent>
              {counties.map((c) => (
                <SelectItem key={c.county_id} value={String(c.county_id)}>
                  {c.county_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="distrito">Distrito</Label>
          <Select
            value={district_id != null ? String(district_id) : ""}
            onValueChange={handleDistrict}
            disabled={county_id == null || districtsLoading}
          >
            <SelectTrigger id="distrito">
              <SelectValue
                placeholder={districtsLoading ? "Cargando..." : "Selecciona distrito"}
              />
            </SelectTrigger>
            <SelectContent>
              {districts.map((d) => (
                <SelectItem key={d.district_id} value={String(d.district_id)}>
                  {d.district_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="barrio">Barrio</Label>
          <Select
            value={neighborhood_id != null ? String(neighborhood_id) : ""}
            onValueChange={handleNeighborhood}
            disabled={district_id == null || nbLoading}
          >
            <SelectTrigger id="barrio">
              <SelectValue
                placeholder={nbLoading ? "Cargando..." : "Selecciona barrio"}
              />
            </SelectTrigger>
            <SelectContent>
              {neighborhoods.map((n) => (
                <SelectItem
                  key={n.neighborhood_id}
                  value={String(n.neighborhood_id)}
                >
                  {n.neighborhood_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="address">Dirección Exacta</Label>
        <Textarea
          id="address"
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="Otras señas (100m sur de..., casa color...)"
          rows={3}
          required
        />
      </div>
    </div>
  );
}

export { COSTA_RICA_ISO };
export type { StructuredAddress };
