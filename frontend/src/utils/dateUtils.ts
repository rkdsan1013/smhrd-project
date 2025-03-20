// /frontend/src/utils/dateUtils.ts
/**
 * formatYear
 * 입력된 년도 문자열이 4자리 미만이면 왼쪽에 0을 채워 4자리 문자열로 변환합니다.
 * 예) "3" -> "0003", "27" -> "0027", "888" -> "0888"
 * 4자리 입력 시 (예: "2023" 또는 "1997")는 그대로 반환합니다.
 */
export const formatYear = (year: string): string => {
    return year.length < 4 && year.length > 0 ? year.padStart(4, '0') : year;
  };
  
  /**
   * formatTwoDigits
   * 입력값이 빈 문자열, 0 또는 올바르지 않으면 "01"로 반환합니다.
   * 한 자리 입력 시 왼쪽에 0을 채워 2자리 문자열로 반환합니다.
   * max를 초과하면 최대값(max)을 2자리 문자열로 반환합니다.
   */
  export const formatTwoDigits = (val: string, max: number): string => {
    const num = parseInt(val, 10);
    if (!val || isNaN(num) || num === 0) return '01';
    if (num > max) return String(max).padStart(2, '0');
    return val.length === 1 ? val.padStart(2, '0') : val;
  };