(function initialiseAhpCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ATHAhp = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function createAhpCore() {
  const RI = {
    1: 0,
    2: 0,
    3: 0.58,
    4: 0.9,
    5: 1.12,
    6: 1.24,
    7: 1.32,
    8: 1.41,
    9: 1.45,
    10: 1.49,
  };

  function judgementToRatio(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number === 0) {
      throw new Error("AHP comparison values must be valid Saaty scale numbers.");
    }
    return number > 0 ? number : 1 / Math.abs(number);
  }

  function matrixFromAnswers(size, answers, prefix) {
    const matrix = Array.from({ length: size }, () => Array(size).fill(1));
    Object.entries(answers).forEach(([key, value]) => {
      if (!key.startsWith(prefix)) return;
      const parts = key.split("-").map((part) => Number(part));
      const i = prefix === "c" ? parts[1] : parts[2];
      const j = prefix === "c" ? parts[2] : parts[3];
      const ratio = judgementToRatio(value);
      matrix[i][j] = ratio;
      matrix[j][i] = 1 / ratio;
    });
    return matrix;
  }

  function aggregateMatrices(matrices) {
    const size = matrices[0].length;
    return Array.from({ length: size }, (_, row) =>
      Array.from({ length: size }, (_, col) => {
        const product = matrices.reduce((total, matrix) => total * matrix[row][col], 1);
        return Math.pow(product, 1 / matrices.length);
      })
    );
  }

  function calculateWeights(matrix) {
    const size = matrix.length;
    const rowGeometricMeans = matrix.map((row) => {
      const product = row.reduce((total, value) => total * value, 1);
      return Math.pow(product, 1 / size);
    });
    const total = rowGeometricMeans.reduce((sum, value) => sum + value, 0);
    const weights = rowGeometricMeans.map((value) => value / total);
    const weightedSums = matrix.map((row) =>
      row.reduce((sum, value, index) => sum + value * weights[index], 0)
    );
    const consistencyVector = weightedSums.map((value, index) => value / weights[index]);
    const lambdaMax = consistencyVector.reduce((sum, value) => sum + value, 0) / size;
    const ci = size <= 2 ? 0 : (lambdaMax - size) / (size - 1);
    const ri = RI[size] || 1.49;
    const cr = ri === 0 ? 0 : ci / ri;
    return { weights, rowGeometricMeans, weightedSums, consistencyVector, lambdaMax, ci, cr };
  }

  function calculateAhp(responses) {
    const questionnaire = responses[0].questionnaire;
    const criteriaCount = questionnaire.criteria.length;
    const alternativeCount = questionnaire.alternatives.length;

    responses.forEach((response) => {
      if (
        response.questionnaire.criteria.length !== criteriaCount ||
        response.questionnaire.alternatives.length !== alternativeCount ||
        response.questionnaire.criteria.join("|") !== questionnaire.criteria.join("|") ||
        response.questionnaire.alternatives.join("|") !== questionnaire.alternatives.join("|")
      ) {
        throw new Error("All response files must use the same questionnaire structure.");
      }
    });

    const criteriaMatrices = responses.map((response) =>
      matrixFromAnswers(criteriaCount, response.answers.criteria, "c")
    );
    const criteriaMatrix = aggregateMatrices(criteriaMatrices);
    const criteriaResult = { matrix: criteriaMatrix, ...calculateWeights(criteriaMatrix) };
    const alternativeResults = questionnaire.criteria.map((criterion, criterionIndex) => {
      const prefix = `a-${criterionIndex}`;
      const matrices = responses.map((response) =>
        matrixFromAnswers(alternativeCount, response.answers.alternatives, prefix)
      );
      const matrix = aggregateMatrices(matrices);
      return { criterion, matrix, ...calculateWeights(matrix) };
    });
    const alternativeScores = questionnaire.alternatives.map((alternative, alternativeIndex) => {
      const score = alternativeResults.reduce((sum, result, criterionIndex) =>
        sum + criteriaResult.weights[criterionIndex] * result.weights[alternativeIndex], 0
      );
      return { alternative, alternativeIndex, score };
    }).sort((a, b) => b.score - a.score);

    return { questionnaire, expertCount: responses.length, criteriaResult, alternativeResults, alternativeScores };
  }

  return {
    RI,
    judgementToRatio,
    matrixFromAnswers,
    aggregateMatrices,
    calculateWeights,
    calculateAhp,
  };
}));
