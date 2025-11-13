/**
 * Compare a date with today.
 * @param {Object} date - Date with string type
 * @returns {Boolean} - Return true if the inputed date is larger than today, else returns false.
 */
export const compareDateWithToday = (date: string): boolean => {
    const inputDate = new Date(date);
    const today = new Date();

    return inputDate.getTime() < today.getTime();
};
