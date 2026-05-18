import type { CustomGoalCode } from "@points-exchange/shared";

export type CustomGoalCatalogItem = {
  code: CustomGoalCode;
  title: string;
  subtitle: string;
};

/** User-facing catalog for CUSTOM goal refinement (not trip-experience planning). */
export const CUSTOM_GOAL_CATALOG: CustomGoalCatalogItem[] = [
  {
    code: "INTERNATIONAL_FLIGHTS",
    title: "International flights",
    subtitle: "Long-haul and overseas routes where partner miles shine.",
  },
  {
    code: "LUXURY_HOTELS",
    title: "Luxury hotels",
    subtitle: "High-end stays and premium room redemptions.",
  },
  {
    code: "DOMESTIC_FLIGHTS",
    title: "Domestic flights",
    subtitle: "U.S. routes with flexible portal or transfer options.",
  },
  {
    code: "FAMILY_VACATION",
    title: "Family vacation",
    subtitle: "Multi-room trips and simpler booking flows.",
  },
  {
    code: "BUSINESS_TRAVEL",
    title: "Business travel",
    subtitle: "Reliable flights, lounges, and last-minute flexibility.",
  },
  {
    code: "ALL_INCLUSIVE_RESORT",
    title: "All-inclusive resort",
    subtitle: "Packages where points can cover the big ticket items.",
  },
  {
    code: "CRUISE_TRAVEL",
    title: "Cruise travel",
    subtitle: "Sailings and cabin upgrades via partners or portals.",
  },
  {
    code: "LAST_MINUTE_TRAVEL",
    title: "Last-minute travel",
    subtitle: "Short-notice trips where portals often win on speed.",
  },
  {
    code: "LOUNGE_AND_STATUS",
    title: "Lounge & status perks",
    subtitle: "Access and comfort benefits beyond the ticket price.",
  },
  {
    code: "EVERYDAY_OFFSET",
    title: "Offset everyday spend",
    subtitle: "Stretch points toward bills and regular purchases.",
  },
];

export const DEFAULT_CUSTOM_GOAL_CODE: CustomGoalCode = "INTERNATIONAL_FLIGHTS";

export const CUSTOM_GOAL_LABELS: Record<CustomGoalCode, string> =
  CUSTOM_GOAL_CATALOG.reduce(
    (acc, item) => {
      acc[item.code] = item.title;
      return acc;
    },
    {} as Record<CustomGoalCode, string>,
  );
