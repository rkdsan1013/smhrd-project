// /frontend/src/utils/dateUtils.ts
export const formatYear = (year: string): string => {
    if (!year) return "";
    return year.length < 4 ? year.padStart(4, "0") : year;
};

export const getMaxDay = (year: string, month: string): number => {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
        return new Date(y, m, 0).getDate();
    }
    return 31;
};

export const formatTwoDigits = (val: string, max: number): string => {
    if (!val) return "";
    const num = parseInt(val, 10);
    if (isNaN(num) || num === 0) return "01";
    if (num > max) return String(max).padStart(2, "0");
    return val.length === 1 ? val.padStart(2, "0") : val;
};