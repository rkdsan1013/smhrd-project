// /frontend/src/utils/normalize.ts

// 이름 정규화: 양쪽 공백 제거 후 연속된 공백을 하나의 공백으로 치환
export const normalizeName = (name: string): string => {
  return name.trim().replace(/\s+/g, " ");
};
