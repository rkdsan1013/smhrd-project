// /backend/src/utils/normalize.js

// 이름 정규화: 양쪽 공백 제거 후 연속된 공백을 하나의 공백으로 치환
function normalizeName(name) {
  return typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
}

module.exports = {
  normalizeName,
};
