/** Apply transfer ratio and optional bonus percent to a points balance. */
export function applyTransferConversion(
  pointsIn: number,
  ratioNum: number,
  ratioDen: number,
  bonusPercent = 0,
): number {
  if (pointsIn <= 0 || ratioDen <= 0) return 0;
  const converted = pointsIn * (ratioNum / ratioDen) * (1 + bonusPercent / 100);
  return Math.floor(converted);
}

/** Scale partner-denominated CPP to originating issuer CPP after a transfer chain. */
export function issuerCppFromPartnerTerminal(
  issuerPoints: number,
  partnerPointsAfterTransfers: number,
  partnerDenominatedCpp: number,
): number {
  if (issuerPoints <= 0 || partnerDenominatedCpp <= 0) return 0;
  return (
    Math.round(
      partnerDenominatedCpp * (partnerPointsAfterTransfers / issuerPoints) * 100,
    ) / 100
  );
}
