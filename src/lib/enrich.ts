import type { EnrichedBestellungen, EnrichedGerichte } from '@/types/enriched';
import type { Bestellungen, Gerichte, Restaurant } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface GerichteMaps {
  restaurantMap: Map<string, Restaurant>;
}

export function enrichGerichte(
  gerichte: Gerichte[],
  maps: GerichteMaps
): EnrichedGerichte[] {
  return gerichte.map(r => ({
    ...r,
    restaurant_refName: resolveDisplay(r.fields.restaurant_ref, maps.restaurantMap, 'restaurant_name'),
  }));
}

interface BestellungenMaps {
  gerichteMap: Map<string, Gerichte>;
}

export function enrichBestellungen(
  bestellungen: Bestellungen[],
  maps: BestellungenMaps
): EnrichedBestellungen[] {
  return bestellungen.map(r => ({
    ...r,
    gewaehlte_gerichteName: resolveDisplay(r.fields.gewaehlte_gerichte, maps.gerichteMap, 'gericht_name'),
  }));
}
