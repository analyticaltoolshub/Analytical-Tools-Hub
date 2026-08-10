(function initialiseIsmCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ATHIsm = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function createIsmCore() {
  function cloneMatrix(matrix) {
    return matrix.map((row) => row.slice());
  }

  function relationshipKey(leftId, rightId) {
    return `${leftId}::${rightId}`;
  }

  function buildInitialMatrix(factors, relationships) {
    const size = factors.length;
    const matrix = Array.from({ length: size }, (_, row) =>
      Array.from({ length: size }, (_, column) => (row === column ? 1 : 0))
    );
    for (let i = 0; i < size; i += 1) {
      for (let j = i + 1; j < size; j += 1) {
        const symbol = relationships.get(relationshipKey(factors[i].id, factors[j].id));
        if (!['V', 'A', 'X', 'O'].includes(symbol)) throw new Error("Every factor pair requires a valid V, A, X, or O judgement.");
        if (symbol === "V" || symbol === "X") matrix[i][j] = 1;
        if (symbol === "A" || symbol === "X") matrix[j][i] = 1;
      }
    }
    return matrix;
  }

  function applyTransitivity(initialMatrix) {
    const finalMatrix = cloneMatrix(initialMatrix);
    const size = finalMatrix.length;
    for (let via = 0; via < size; via += 1) {
      for (let from = 0; from < size; from += 1) {
        if (!finalMatrix[from][via]) continue;
        for (let to = 0; to < size; to += 1) {
          if (finalMatrix[via][to]) finalMatrix[from][to] = 1;
        }
      }
    }
    const transitive = finalMatrix.map((row, i) =>
      row.map((value, j) => Boolean(value && !initialMatrix[i][j] && i !== j))
    );
    return { finalMatrix, transitive };
  }

  function partitionLevels(finalMatrix, factors) {
    const remaining = new Set(factors.map((_, index) => index));
    const partitions = [];
    const levels = [];
    let level = 1;
    while (remaining.size) {
      const currentIndexes = Array.from(remaining);
      const assigned = [];
      currentIndexes.forEach((factorIndex) => {
        const reachability = currentIndexes.filter((index) => finalMatrix[factorIndex][index] === 1);
        const antecedent = currentIndexes.filter((index) => finalMatrix[index][factorIndex] === 1);
        const antecedentSet = new Set(antecedent);
        const intersection = reachability.filter((index) => antecedentSet.has(index));
        const isAssigned = reachability.length === intersection.length && reachability.every((index) => antecedentSet.has(index));
        partitions.push({ factorIndex, level: isAssigned ? level : null, iteration: level, reachability, antecedent, intersection, assigned: isAssigned });
        if (isAssigned) assigned.push(factorIndex);
      });
      if (!assigned.length) throw new Error("The ISM level partition could not advance. Review the reachability matrix.");
      levels.push(assigned);
      assigned.forEach((index) => remaining.delete(index));
      level += 1;
    }
    const factorLevels = Array(factors.length).fill(0);
    levels.forEach((indexes, levelIndex) => indexes.forEach((factorIndex) => { factorLevels[factorIndex] = levelIndex + 1; }));
    return { levels, factorLevels, partitions };
  }

  function calculatePowers(finalMatrix) {
    const size = finalMatrix.length;
    return {
      driving: finalMatrix.map((row) => row.reduce((sum, value) => sum + value, 0)),
      dependence: Array.from({ length: size }, (_, column) => finalMatrix.reduce((sum, row) => sum + row[column], 0)),
    };
  }

  function classifyMicmac(driving, dependence) {
    const averageDriving = driving.reduce((sum, value) => sum + value, 0) / driving.length;
    const averageDependence = dependence.reduce((sum, value) => sum + value, 0) / dependence.length;
    const classifications = driving.map((drive, index) => {
      const highDriving = drive >= averageDriving;
      const highDependence = dependence[index] >= averageDependence;
      if (!highDriving && !highDependence) return "Autonomous";
      if (!highDriving && highDependence) return "Dependent";
      if (highDriving && highDependence) return "Linkage";
      return "Independent/driving";
    });
    return { averageDriving, averageDependence, classifications };
  }

  function analyzeModel(factors, relationships) {
    const initialMatrix = buildInitialMatrix(factors, relationships);
    const { finalMatrix, transitive } = applyTransitivity(initialMatrix);
    const partition = partitionLevels(finalMatrix, factors);
    const powers = calculatePowers(finalMatrix);
    return { initialMatrix, finalMatrix, transitive, ...partition, ...powers, ...classifyMicmac(powers.driving, powers.dependence) };
  }

  return { relationshipKey, buildInitialMatrix, applyTransitivity, partitionLevels, calculatePowers, classifyMicmac, analyzeModel };
}));
