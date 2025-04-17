// /frontend/src/utils/dateUtils.ts

// 연도 포맷팅: 연도가 4자리 미만이면 앞에 0을 붙여 4자리 문자열로 만듦
export const formatYear = (year: string): string => {
  if (!year) return "";
  return year.length < 4 ? year.padStart(4, "0") : year;
};

// 두 자리 포맷팅: 한 자리면 0을 붙이고, 최대값 초과 시 최대값 반환
export const formatTwoDigits = (val: string, max: number): string => {
  if (!val) return "";
  const num = parseInt(val, 10);
  if (isNaN(num) || num === 0) return "01";
  if (num > max) return String(max).padStart(2, "0");
  return val.length === 1 ? val.padStart(2, "0") : val;
};

// 최대 날짜 계산: 주어진 연도와 월을 기준으로 해당 월의 마지막 일을 반환
export const getMaxDay = (year: string, month: string): number => {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
    return new Date(y, m, 0).getDate();
  }
  return 31;
};
