// Temporary Semgrep probe. This intentionally contains a non-literal RegExp sink
// so we can verify which commit the manual workflow scans and what finding it reports.
export function buildProbeRegex(userControlledPattern: string): RegExp {
  return new RegExp(userControlledPattern);
}

// Trigger a PR synchronize event after changing checkout behavior in the probe workflow.
