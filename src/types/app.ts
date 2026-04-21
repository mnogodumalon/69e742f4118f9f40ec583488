// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Restaurant {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    restaurant_name?: string;
    restaurant_tel?: string;
    restaurant_url?: string;
    lieferzeit?: string;
    mindestbestellwert?: number;
    lieferkosten?: number;
    hinweise?: string;
  };
}

export interface Gerichte {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    restaurant_ref?: string; // applookup -> URL zu 'Restaurant' Record
    gericht_name?: string;
    kategorie?: LookupValue;
    beschreibung?: string;
    preis?: number;
    vegetarisch?: boolean;
    vegan?: boolean;
    allergene?: string;
  };
}

export interface Bestellungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    gewaehlte_gerichte?: string; // applookup -> URL zu 'Gerichte' Record
    sonderwunsch?: string;
    zahlungsart?: LookupValue;
    bereits_bezahlt?: boolean;
  };
}

export const APP_IDS = {
  RESTAURANT: '69e742df70dfb1e5316788c9',
  GERICHTE: '69e742e2cf5fc9c325cecbe7',
  BESTELLUNGEN: '69e742e32ffc6b123a5e9512',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'gerichte': {
    kategorie: [{ key: "vorspeise", label: "Vorspeise" }, { key: "hauptgericht", label: "Hauptgericht" }, { key: "beilage", label: "Beilage" }, { key: "dessert", label: "Dessert" }, { key: "getraenk", label: "Getränk" }, { key: "sonstiges", label: "Sonstiges" }],
  },
  'bestellungen': {
    zahlungsart: [{ key: "bar", label: "Bar" }, { key: "paypal", label: "PayPal" }, { key: "ueberweisung", label: "Überweisung" }, { key: "sonstiges", label: "Sonstiges" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'restaurant': {
    'restaurant_name': 'string/text',
    'restaurant_tel': 'string/tel',
    'restaurant_url': 'string/url',
    'lieferzeit': 'string/text',
    'mindestbestellwert': 'number',
    'lieferkosten': 'number',
    'hinweise': 'string/textarea',
  },
  'gerichte': {
    'restaurant_ref': 'applookup/select',
    'gericht_name': 'string/text',
    'kategorie': 'lookup/select',
    'beschreibung': 'string/textarea',
    'preis': 'number',
    'vegetarisch': 'bool',
    'vegan': 'bool',
    'allergene': 'string/text',
  },
  'bestellungen': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'gewaehlte_gerichte': 'applookup/select',
    'sonderwunsch': 'string/textarea',
    'zahlungsart': 'lookup/radio',
    'bereits_bezahlt': 'bool',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateRestaurant = StripLookup<Restaurant['fields']>;
export type CreateGerichte = StripLookup<Gerichte['fields']>;
export type CreateBestellungen = StripLookup<Bestellungen['fields']>;