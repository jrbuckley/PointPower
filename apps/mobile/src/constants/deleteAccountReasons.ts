export type DeleteAccountReasonCode =
  | "not_using"
  | "privacy"
  | "missing_features"
  | "too_complicated"
  | "other";

export type DeleteAccountReason = {
  code: DeleteAccountReasonCode;
  label: string;
};

export const DELETE_ACCOUNT_REASONS: DeleteAccountReason[] = [
  { code: "not_using", label: "I'm not using it anymore" },
  { code: "privacy", label: "Privacy concerns" },
  { code: "missing_features", label: "Missing features I need" },
  { code: "too_complicated", label: "Too complicated" },
  { code: "other", label: "Other" },
];
