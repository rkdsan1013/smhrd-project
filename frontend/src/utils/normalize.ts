// /frontend/src/utils/normalize.ts

export const normalizeName = (name: string): string => {
  return name.trim().replace(/\s+/g, " ");
};
