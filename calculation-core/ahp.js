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
    if ((typeof value !== "number" && typeof value !== "string") || String(value).trim() === "" || !Number.isInteger(number) || number === 0 || Math.abs(number) > 9) {
      throw new Error("AHP comparison values must be valid Saaty scale numbers.");
    }
    return number > 0 ? number : 1 / Math.abs(number);
  }

  function matrixFromAnswers(size, answers, prefix) {
    const matrix = Array.from({ length: size }, () => Array(size).fill(1));
    Object.entries(answers).forEach(([key, value]) => {
      if (!(key === prefix || key.startsWith(`${prefix}-`))) return;
      const parts = key.split("-").map((part) => Number(part));
      const i = prefix === "c" ? parts[1] : parts[2];
      const j = prefix === "c" ? parts[2] : parts[3];
      if (!Number.isInteger(i) || !Number.isInteger(j) || i < 0 || j >= size || i >= j || key !== `${prefix}-${i}-${j}`) throw new Error("Invalid AHP comparison indices.");
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
      const children = Array.isArray(criterion.children)
        ? criterion.children.map((child, childIndex) => normaliseCriterion(child, childIndex))
        : [];
      const type = criterion.type === "objective" ? "objective" : "subjective";
      const direction = criterion.direction === "lower" ? "lower" : "higher";
      return {
        name: criterionName(criterion, index),
        description: String(criterion.description || "").trim(),
        type,
        direction,
        children,
      };
    }
    return {
      name: criterionName(criterion, index),
      description: "",
      type: "subjective",
      direction: "higher",
      children: [],
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

  function criterionSignature(criteria) {
    return criteria.map((criterion) => {
      const childSignature = criterion.children && criterion.children.length
        ? `[${criterionSignature(criterion.children)}]`
        : "";
      return `${criterion.name}:${criterion.type}:${criterion.direction}${childSignature}`;
    }).join("|");
  }

  function leafCriteriaFromCriteria(criteria, criteriaWeights = []) {
    const leaves = [];
    criteria.forEach((criterion, criterionIndex) => {
      const parentWeight = criteriaWeights[criterionIndex] ?? 1;
      if (criterion.children && criterion.children.length) {
        criterion.children.forEach((child, childIndex) => {
          leaves.push({
            ...child,
            parentName: criterion.name,
            parentIndex: criterionIndex,
            childIndex,
            label: `${criterion.name}: ${child.name}`,
            globalWeight: parentWeight,
          });
        });
        return;
      }
      leaves.push({
        ...criterion,
        parentName: "",
        parentIndex: criterionIndex,
        childIndex: null,
        label: criterion.name,
        globalWeight: parentWeight,
      });
    });
    leaves.forEach((leaf, index) => {
      leaf.globalIndex = index;
    });
    return leaves;
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
      const number = objectiveNumber(value);
      if (!Number.isFinite(number)) {
        throw new Error("Objective criteria values must be numeric.");
      }
      return number;
    });
  }

  function calculateObjectivePriorities(criterion, rawValues) {
    const values = rawValues.map(objectiveNumber);
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
      criterion: criterion.label || criterion.name,
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

  function requirePairwiseAnswers(answers, ids) {
    if (!answers || typeof answers !== "object" || Array.isArray(answers) || Object.keys(answers).some((id) => !ids.includes(id))) {
      throw new Error("AHP response contains unexpected comparison IDs.");
    }
    ids.forEach((id) => {
      if (!Number.isFinite(Number(answers?.[id]))) {
        throw new Error("AHP calculation is missing one or more required pairwise answers.");
      }
      judgementToRatio(answers[id]);
    });
  }

  function objectiveNumber(value) {
    if ((typeof value !== "string" && typeof value !== "number") || String(value).trim() === "" || !Number.isFinite(Number(value))) {
      throw new Error("Enter a numeric measured value for every alternative; blank values are not zero.");
    }
    return Number(value);
  }

  function validateStructure(questionnaire) {
    if (!questionnaire || !Array.isArray(questionnaire.criteria) || !Array.isArray(questionnaire.alternatives) || questionnaire.criteria.length < 2 || questionnaire.criteria.length > 10 || questionnaire.alternatives.length < 2 || questionnaire.alternatives.length > 10) {
      throw new Error("AHP requires between two and ten criteria and alternatives.");
    }
    if (questionnaire.criteriaMeta !== undefined && (!Array.isArray(questionnaire.criteriaMeta) || questionnaire.criteriaMeta.length !== questionnaire.criteria.length)) {
      throw new Error("Criterion metadata must match the criteria.");
    }
    function check(item, depth) {
      if (typeof item === "string" && item.trim()) return;
      if (!item || typeof item !== "object" || typeof item.name !== "string" || !item.name.trim()) throw new Error("Every criterion needs a name.");
      if (item.type !== undefined && !["subjective", "objective"].includes(item.type)) throw new Error("Select a valid criterion type.");
      if (item.criterionType !== undefined && !["subjective", "objective"].includes(item.criterionType)) throw new Error("Select a valid criterion type.");
      if (item.direction !== undefined && !["higher", "lower"].includes(item.direction)) throw new Error("Select a valid objective direction.");
      if (item.children !== undefined && !Array.isArray(item.children)) throw new Error("Sub-criteria must be a list.");
      if (item.children?.length) {
        if (depth || item.children.length < 2 || item.children.length > 8) throw new Error("Use one level of two to eight sub-criteria per parent.");
        item.children.forEach((child) => check(child, depth + 1));
      }
    }
    (questionnaire.criteriaMeta || questionnaire.criteria).forEach((item) => check(item, 0));
    if (questionnaire.alternatives.some((name) => typeof name !== "string" || !name.trim())) throw new Error("Every alternative needs a name.");
  }

  function validateAnswers(questionnaire, answers) {
    validateStructure(questionnaire);
    const criteria = criteriaFromQuestionnaire(questionnaire);
    requirePairwiseAnswers(answers?.criteria, pairIds("c", criteria.length));
    requirePairwiseAnswers(answers?.subcriteria || {}, criteria.flatMap((criterion, index) => pairIds(`s-${index}`, criterion.children.length)));
    requirePairwiseAnswers(answers?.alternatives || {}, leafCriteriaFromCriteria(criteria).flatMap((criterion, index) => criterion.type === "objective" ? [] : pairIds(`a-${index}`, questionnaire.alternatives.length)));
  }

  function pairIds(prefix, size) {
    const ids = [];
    for (let i = 0; i < size; i++) {
      for (let j = i + 1; j < size; j++) {
        ids.push(`${prefix}-${i}-${j}`);
      }
    }
    return ids;
  }

  function calculateAhp(responses, options = {}) {
    if (!Array.isArray(responses) || !responses.length) throw new Error("Load at least one completed response.");
    responses.forEach((response) => validateAnswers(response.questionnaire, response.answers));
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
        criterionSignature(responseCriteria) !== criterionSignature(criteria) ||
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

    const subcriteriaResults = criteria.map((criterion, criterionIndex) => {
      if (!criterion.children || !criterion.children.length) return null;
      const prefix = `s-${criterionIndex}`;
      const matrices = responses.map((response) =>
        matrixFromAnswers(criterion.children.length, response.answers.subcriteria || {}, prefix)
      );
      const matrix = aggregateMatrices(matrices);
      return {
        criterion: criterion.name,
        criterionIndex,
        children: criterion.children.map((child) => child.name),
        matrix,
        ...calculateWeights(matrix),
      };
    });

    const leafCriteria = [];
    criteria.forEach((criterion, criterionIndex) => {
      const parentWeight = criteriaResult.weights[criterionIndex];
      if (criterion.children && criterion.children.length) {
        const subResult = subcriteriaResults[criterionIndex];
        criterion.children.forEach((child, childIndex) => {
          const localWeight = subResult.weights[childIndex];
          leafCriteria.push({
            ...child,
            parentName: criterion.name,
            parentIndex: criterionIndex,
            childIndex,
            label: `${criterion.name}: ${child.name}`,
            localWeight,
            globalWeight: parentWeight * localWeight,
          });
        });
        return;
      }
      leafCriteria.push({
        ...criterion,
        parentName: "",
        parentIndex: criterionIndex,
        childIndex: null,
        label: criterion.name,
        localWeight: parentWeight,
        globalWeight: parentWeight,
      });
    });
    leafCriteria.forEach((criterion, index) => {
      criterion.globalIndex = index;
    });
    const leafWeights = leafCriteria.map((criterion) => criterion.globalWeight);

    const alternativeResults = leafCriteria.map((criterion, leafIndex) => {
      if (criterion.type === "objective") {
        return calculateObjectivePriorities(
          criterion,
          objectiveValueList(options.objectiveValues, leafIndex, alternativeCount)
        );
      }

      const prefix = `a-${leafIndex}`;
      const matrices = responses.map((response) =>
        matrixFromAnswers(alternativeCount, response.answers.alternatives, prefix)
      );
      const matrix = aggregateMatrices(matrices);
      return {
        criterion: criterion.label || criterion.name,
        criterionMeta: criterion,
        type: "subjective",
        matrix,
        ...calculateWeights(matrix),
      };
    });
    const alternativeScores = questionnaire.alternatives.map((alternative, alternativeIndex) => {
      const score = alternativeResults.reduce((sum, result, leafIndex) =>
        sum + leafWeights[leafIndex] * result.weights[alternativeIndex], 0
      );
      return { alternative, alternativeIndex, score };
    }).sort((a, b) => b.score - a.score);

    return {
      questionnaire: { ...questionnaire, criteria: criteriaNames, criteriaMeta: criteria },
      expertCount: responses.length,
      criteriaResult,
      subcriteriaResults,
      leafCriteria,
      leafWeights,
      alternativeResults,
      alternativeScores,
    };
  }

  return {
    objectiveNumber,
    validateStructure,
    validateAnswers,
    RI,
    normaliseCriterion,
    normaliseCriteria,
    criteriaFromQuestionnaire,
    leafCriteriaFromCriteria,
    judgementToRatio,
    matrixFromAnswers,
    aggregateMatrices,
    calculateWeights,
    calculateObjectivePriorities,
    calculateAhp,
  };
}));
