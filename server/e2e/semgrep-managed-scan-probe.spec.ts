// Temporary Semgrep managed-scan probe. This file is intentionally insecure and must not be merged.
// It exists only to verify that the repository's Semgrep AppSec Platform PR check
// can discover a deliberately introduced non-literal RegExp finding.

export function semgrepManagedScanProbe(userControlledPattern: string) {
  return new RegExp(userControlledPattern);
}
