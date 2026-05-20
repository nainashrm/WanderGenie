const INTEREST_OPTIONS = [
  "beaches","cafes","nightlife","adventure","mountains",
  "culture","shopping","food","history","nature","wellness",
];

const TRAVEL_STYLE_OPTIONS = [
  "budget","mid-range","luxury","adventure","family","solo","couple","group","balanced",
];

const BUDGET_TIERS = {
  budget:  { max: 15000,  label: "Budget" },
  mid:     { max: 50000,  label: "Mid-range" },
  comfort: { max: 150000, label: "Comfortable" },
  luxury:  { max: Infinity, label: "Luxury" },
};

module.exports = { INTEREST_OPTIONS, TRAVEL_STYLE_OPTIONS, BUDGET_TIERS };
