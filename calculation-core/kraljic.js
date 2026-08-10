(function initialiseKraljicCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ATHKraljic = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function createKraljicCore() {
  function calculateRiskDetails(assessment) {
    if (!assessment || !assessment.scoresConfirmed || !assessment.weightMode || !assessment.factors?.length) {
      return null;
    }
    const equalWeight = 100 / assessment.factors.length;
    const weights = assessment.weightMode === "equal"
      ? Object.fromEntries(assessment.factors.map((factor) => [factor.id, equalWeight]))
      : assessment.weights;
    const totalWeight = assessment.factors.reduce((total, factor) => total + Number(weights[factor.id] || 0), 0);
    if (Math.abs(totalWeight - 100) > 0.01) return null;

    const rows = assessment.factors.map((factor) => {
      const score = Number(assessment.scores[factor.id]);
      const weight = Number(weights[factor.id] || 0);
      if (!Number.isFinite(score) || score < 1 || score > 5 || !Number.isFinite(weight) || weight < 0) {
        throw new Error("Risk scores must be between 1 and 5 and weights must be nonnegative.");
      }
      return { factor, score, weight, contribution: score * (weight / 100) };
    });

    return {
      assessment: { ...assessment, weights },
      rows,
      overall: rows.reduce((total, row) => total + row.contribution, 0),
    };
  }

  function classifyItem(item) {
    const impact = Number(item.impact);
    const risk = Number(item.risk);
    if (!Number.isFinite(impact) || !Number.isFinite(risk) || impact < 1 || impact > 5 || risk < 1 || risk > 5) {
      return null;
    }
    if (impact > 2 && risk > 2) return "strategic";
    if (impact <= 2 && risk > 2) return "bottleneck";
    if (impact > 2 && risk <= 2) return "leverage";
    return "non-critical";
  }

  function calculateImpactScores(items) {
    if (!items.length) return [];
    const spends = items.map((item) => Number(item.annualSpend));
    if (spends.some((spend) => !Number.isFinite(spend) || spend < 0)) {
      throw new Error("Annual spend must be nonnegative.");
    }
    const minSpend = Math.min(...spends);
    const maxSpend = Math.max(...spends);
    return items.map((item) => {
      if (maxSpend === minSpend) return { ...item, impact: 3 };
      const normalized = (Number(item.annualSpend) - minSpend) / (maxSpend - minSpend);
      return { ...item, impact: Math.min(5, Math.max(1, Math.round(normalized * 4) + 1)) };
    });
  }

  return { calculateRiskDetails, classifyItem, calculateImpactScores };
}));
