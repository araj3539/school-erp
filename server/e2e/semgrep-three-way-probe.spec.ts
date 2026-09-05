export function buildProbeRegex(userControlledPattern: string): RegExp {
  return new RegExp(userControlledPattern);
}
