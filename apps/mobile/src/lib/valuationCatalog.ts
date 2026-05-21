import { DEFAULT_VALUATION_CATALOG } from "@points-exchange/recommendations";
import type { ValuationCatalog } from "@points-exchange/shared";

let activeCatalog: ValuationCatalog = DEFAULT_VALUATION_CATALOG;

export function getValuationCatalog(): ValuationCatalog {
  return activeCatalog;
}

export function setValuationCatalog(catalog: ValuationCatalog): void {
  activeCatalog = catalog;
}
