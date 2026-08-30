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

  function criterionName(criterion, index) {
    if (criterion && typeof criterion === "object") {
      return String(criterion.name || `Criterion ${index + 1}`).trim() || `Criterion ${index + 1}`;
    }
    return String(criterion || `Criterion ${index + 1}`).trim() || `Criterion ${index + 1}`;
  }

  function normaliseCriterion(criterion, index) {
    if (criterion && typeof criterion === "object") {
      const type = criterion.type === "objective" ? "objective" : "subjective";
      const direction = criterion.direction === "lower" ? "lower" : "higher";
      return {
        name: criterionName(criterion, index),
        description: String(criterion.description || "").trim(),
        type,
        direction,
      };
    }
    return {
      name: criterionName(criterion, index),
      description: "",
      type: "subjective",
      direction: "higher",
    };
  }

  function normaliseCriteria(criteria) {
    return criteria.map((criterion, index) => normaliseCriterion(criterion, index));
  }

  function criteriaFromQuestionnaire(questionnaire) {
    const criteria = questionnaire.criteria || [];
    if (Array.isArray(questionnaire.criteriaMeta) && questionnaire.criteriaMeta.length === criteria.length) {
      return questionnaire.criteriaMeta.map((criterion, index) =>
        normaliseCriterion({ ...criterion, name: criterionName(criterion.name || criteria[index], index) }, index)
      );
    }
    return normaliseCriteria(criteria);
  }

  function objectiveValueList(objectiveValues, criterionIndex, alternativeCount) {
    const values = objectiveValues || {};
    const row = Array.isArray(values)
      ? values[criterionIndex]
      : values[String(criterionIndex)] ?? values[criterionIndex];
    if (!Array.isArray(row)) {
      throw new Error("Objective criteria require measured alternative values before AHP can be calculated.");
    }
    if (row.length < alternativeCount) {
      throw new Error("Objective criteria values must be provided for every alternative.");
    }
    return row.slice(0, alternativeCount).map((value) => {
      const number = Number(value);
      if (!Number.isFinite(number)) {
        throw new Error("Objective criteria values must be numeric.");
      }
      return number;
    });
  }

  function calculateObjectivePriorities(criterion, rawValues) {
    const values = rawValues.map(Number);
    let transformedValues;
    if (criterion.direction === "lower") {
      if (values.some((value) => value <= 0)) {
        throw new Error(`${criterion.name} uses lower-is-better objective scoring, so every value must be greater than zero.`);
      }
      transformedValues = values.map((value) => 1 / value);
    } else {
      if (values.some((value) => value < 0)) {
        throw new Error(`${criterion.name} uses higher-is-better objective scoring, so values cannot be negative.`);
      }
      transformedValues = values.slice();
    }

    const total = transformedValues.reduce((sum, value) => sum + value, 0);
    if (total <= 0) {
      throw new Error(`${criterion.name} objective values do not contain enough positive information to calculate priorities.`);
    }

    return {
      criterion: criterion.name,
      criterionMeta: criterion,
      type: "objective",
      direction: criterion.direction,
      values,
      transformedValues,
      weights: transformedValues.map((value) => value / total),
      matrix: null,
      cr: null,
      ci: null,
      lambdaMax: null,
    };
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

  function calculateAhp(responses, options = {}) {
    const questionnaire = responses[0].questionnaire;
    const criteria = criteriaFromQuestionnaire(questionnaire);
    const criteriaNames = criteria.map((criterion) => criterion.name);
    const criteriaCount = criteria.length;
    const alternativeCount = questionnaire.alternatives.length;

    responses.forEach((response) => {
      const responseCriteria = criteriaFromQuestionnaire(response.questionnaire);
      if (
        responseCriteria.length !== criteriaCount ||
        response.questionnaire.alternatives.length !== alternativeCount ||
        responseCriteria.map((criterion) => `${criterion.name}:${criterion.type}:${criterion.direction}`).join("|") !==
          criteria.map((criterion) => `${criterion.name}:${criterion.type}:${criterion.direction}`).join("|") ||
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
    const alternativeResults = criteria.map((criterion, criterionIndex) => {
      if (criterion.type === "objective") {
        return calculateObjectivePriorities(
          criterion,
          objectiveValueList(options.objectiveValues, criterionIndex, alternativeCount)
        );
      }

      const prefix = `a-${criterionIndex}`;
      const matrices = responses.map((response) =>
        matrixFromAnswers(alternativeCount, response.answers.alternatives, prefix)
      );
      const matrix = aggregateMatrices(matrices);
      return {
        criterion: criterion.name,
        criterionMeta: criterion,
        type: "subjective",
        matrix,
        ...calculateWeights(matrix),
      };
    });
    const alternativeScores = questionnaire.alternatives.map((alternative, alternativeIndex) => {
      const score = alternativeResults.reduce((sum, result, criterionIndex) =>
        sum + criteriaResult.weights[criterionIndex] * result.weights[alternativeIndex], 0
      );
      return { alternative, alternativeIndex, score };
    }).sort((a, b) => b.score - a.score);

    return {
      questionnaire: { ...questionnaire, criteria: criteriaNames, criteriaMeta: criteria },
      expertCount: responses.length,
      criteriaResult,
      alternativeResults,
      alternativeScores,
    };
  }

  return {
    RI,
    normaliseCriterion,
    normaliseCriteria,
    criteriaFromQuestionnaire,
    judgementToRatio,
    matrixFromAnswers,
    aggregateMatrices,
    calculateWeights,
    calculateObjectivePriorities,
    calculateAhp,
  };
}));
