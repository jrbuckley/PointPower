import type { ValuationCatalog } from "@points-exchange/shared";
import { valuationCatalogSchema } from "@points-exchange/shared";
import { DEFAULT_VALUATION_CATALOG } from "@points-exchange/recommendations";
import { getApiBaseUrl, isApiConfigured } from "./apiClient";

export async function fetchValuationCatalog(): Promise<ValuationCatalog> {
  if (!isApiConfigured()) {
    return DEFAULT_VALUATION_CATALOG;
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v1/valuation-catalog`);
  if (!response.ok) {
    return DEFAULT_VALUATION_CATALOG;
  }

  const payload = (await response.json()) as { catalog: unknown };
  const parsed = valuationCatalogSchema.safeParse(payload.catalog);
  return parsed.success ? parsed.data : DEFAULT_VALUATION_CATALOG;
}
