const INTEREST_OPTIONS = [
  "beaches",
  "cafes",
  "nightlife",
  "adventure",
  "mountains",
  "culture",
  "shopping",
];

const BUDGET_TIERS = {
  budget: { min: 0, max: 15000, label: "Budget" },
  mid: { min: 15001, max: 50000, label: "Mid-range" },
  premium: { min: 50001, max: Infinity, label: "Premium" },
};

module.exports = { INTEREST_OPTIONS, BUDGET_TIERS };
