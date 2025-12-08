/**
 * Checks whether a given date is in the future compared to today.
 * @param date - The date string to compare.
 * @returns True if the provided date is later than today; otherwise, false.
 */
export const isFutureDate = (date: string): boolean => {
    const inputDate = new Date(date);
    const today = new Date();
    return inputDate.getTime() < today.getTime();
};
