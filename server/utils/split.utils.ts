
export function splitAmount(
  totalCents: number,
  memberCount: number,
): number[] {
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) {
    throw new Error("Total amount must be a positive whole number.");
  }

  if (!Number.isSafeInteger(memberCount) || memberCount <= 0) {
    throw new Error("At least one member is required.");
  }

  const baseAmount = Math.floor(totalCents / memberCount);
  const remainder = totalCents % memberCount;

  return Array.from(
    { length: memberCount },
    (_, index) => baseAmount + (index < remainder ? 1 : 0),
  );
}
