export function getMonthLength(year: number, month: number): number {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Invalid month "${month}". Expected an integer from 1 to 12.`);
  }

  return new Date(year, month, 0).getDate();
}
