export interface WorkZoneItem {
  workZoneLabel: string;
  workZoneName: string;
  status: string;
  travelArea: string;
  keys: string[];
}

export interface WorkZoneResponse {
  items: WorkZoneItem[];
  hasMore: boolean;
  offset: number;
  totalResults: number;
}

export interface ResourceResponse {
  items: any[];
  offset: number;
  limit: number;
  totalResults: number;
}

export interface Response {
  items: any[];
  offset: number;
  limit: number;
  totalResults: number;
}

export interface InventoryTranslation {
  language: string;
  name: string;
  unitOfMeasurement: string;
  languageISO: string;
}

export interface InventoryTypePayload {
  label: string;
  name: string;
  unitOfMeasurement: string;
  active: boolean;
  nonSerialized: boolean;
  modelProperty: string;
  quantityPrecision: number;
  translations: InventoryTranslation[];
}


export interface EventResponse {
  found?: boolean;
  nextPage?: string;
  items?: any[];
}