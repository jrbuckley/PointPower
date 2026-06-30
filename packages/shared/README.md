# Shared types & validation

`@points-exchange/shared` holds **Zod schemas** and TypeScript types used by the API, mobile app, and recommendations package. Keeping contracts here avoids drift between HTTP payloads and engine inputs.

## Build

```bash
npm run build --workspace=@points-exchange/shared
```

## Main exports

### User & accounts

- `rewardProgramSchema`, `rewardAccountSchema` — Postgres-aligned program and balance rows
- `createRewardAccountInputSchema`, `syncRewardAccountsInputSchema`, `updateRewardAccountInputSchema`
- `updateUserProfileInputSchema` — goal preference and custom goal code
- `goalPreferenceSchema`, `customGoalCodeSchema`

### Recommendations

- `recommendationIdSchema` — strategy ids (`MOST_EFFECTIVE`, …) plus legacy aliases
- `createSavedOfferInputSchema` — `offerKey` + `recommendationId` (strategy id, not a DB bucket)

### Valuation catalog (`valuations.ts`)

- `valuationRuleSchema` — CPP min/max/typical per program × method (× optional partner)
- `redemptionOfferTemplateSchema` — offer catalog row shape
- `redemptionProductSchema` — product leaf shape
- `issuerTransferEdgeSchema`, `partnerTransferEdgeSchema`, `transferBonusSchema`
- `goalRedemptionTargetSchema`
- `valuationCatalogSchema` — aggregate loaded by the API and passed to the engine

### Legacy / preview

- `manualProgramEntrySchema` — in-memory `/api/v1/programs` (pre-Supabase prototype)
- `linkedAccountStubSchema`, `mockLinkConnectInputSchema` — mock linking types

## Usage

```typescript
import {
  valuationCatalogSchema,
  type ValuationCatalog,
  updateUserProfileInputSchema,
} from "@points-exchange/shared";
```

API routes parse request bodies with these schemas; the recommendations package imports types and catalog shape from the same definitions.

## Related docs

- How the catalog is populated: [supabase/README.md](../../supabase/README.md)
- How the catalog is consumed: [packages/recommendations/README.md](../recommendations/README.md)
