let sequence = 0;

/** A unique external_id/company_id pair for a review submitted through the
 * form during a test. Every spec needs one of these — the suite never
 * deletes what it creates (see root README), so identities must stay
 * unique across parallel workers and repeated runs against the same
 * persistent dev database, not just within a single test. */
export function uniqueReviewIdentity(label: string): { externalId: string; companyId: string } {
  sequence += 1;
  const suffix = `${Date.now()}-${sequence}`;
  return {
    externalId: `e2e-${slugify(label)}-${suffix}`,
    companyId: `${label} ${suffix}`,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
