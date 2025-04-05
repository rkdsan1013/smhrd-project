// /backend/src/utils/normalize.js

function normalizeName(name) {
  return typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
}

module.exports = {
  normalizeName,
};
