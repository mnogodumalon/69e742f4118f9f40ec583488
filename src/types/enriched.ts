import type { Bestellungen, Gerichte } from './app';

export type EnrichedGerichte = Gerichte & {
  restaurant_refName: string;
};

export type EnrichedBestellungen = Bestellungen & {
  gewaehlte_gerichteName: string;
};
