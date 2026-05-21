import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchValuationCatalog } from "../lib/valuationCatalogApi";
import { setValuationCatalog } from "../lib/valuationCatalog";
import { isApiConfigured } from "../lib/apiClient";

export function useValuationCatalog(enabled = true) {
  const query = useQuery({
    queryKey: ["valuation-catalog"] as const,
    queryFn: fetchValuationCatalog,
    enabled: enabled && isApiConfigured(),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (query.data) {
      setValuationCatalog(query.data);
    }
  }, [query.data]);

  return query;
}
