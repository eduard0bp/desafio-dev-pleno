let sequence = 0;

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
