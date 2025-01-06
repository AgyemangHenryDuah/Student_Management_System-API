const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) =>
    current && current[key] !== undefined ? current[key] : undefined,
    obj
  );
};

const getValue = (item, key) => {
  const value = getNestedValue(item, key);

  // Handle undefined/null
  if (value === undefined || value === null) {
    return -Infinity;
  }

  // Handle NaN - should be sorted to the end
  if (typeof value === 'number' && isNaN(value)) {
    return Infinity;
  }

  return value;
};

const quickSort = (arr, key) => {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const pivotVal = getValue(pivot, key);

  const left = arr.filter(x => {
    const xVal = getValue(x, key);
    return typeof xVal === 'string'
      ? xVal.localeCompare(pivotVal) < 0
      : xVal < pivotVal;
  });

  const middle = arr.filter(x => {
    const xVal = getValue(x, key);
    return typeof xVal === 'string'
      ? xVal.localeCompare(pivotVal) === 0
      : xVal === pivotVal;
  });

  const right = arr.filter(x => {
    const xVal = getValue(x, key);
    return typeof xVal === 'string'
      ? xVal.localeCompare(pivotVal) > 0
      : xVal > pivotVal;
  });

  return [...quickSort(left, key), ...middle, ...quickSort(right, key)];
};

const compareValues = (a, b) => {
  if (typeof a === 'string') {
    return a.localeCompare(b);
  }

  // Handle special cases for numbers
  if (a === b) return 0;
  if (a === -Infinity) return -1;
  if (b === -Infinity) return 1;
  if (a === Infinity) return 1;
  if (b === Infinity) return -1;
  return a < b ? -1 : 1;
};

const merge = (left, right, key) => {
  const result = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    const leftVal = getValue(left[leftIndex], key);
    const rightVal = getValue(right[rightIndex], key);

    const comparison = compareValues(leftVal, rightVal);

    if (comparison <= 0) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }

  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
};

const mergeSort = (arr, key) => {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = arr.slice(0, mid);
  const right = arr.slice(mid);

  return merge(mergeSort(left, key), mergeSort(right, key), key);
};

module.exports = { quickSort, mergeSort };

// const quickSort = (arr, key) => {
//   if (arr.length <= 1) return arr;

//   const pivot = arr[Math.floor(arr.length / 2)];
//   const left = arr.filter((x) => x[key] < pivot[key]);
//   const middle = arr.filter((x) => x[key] === pivot[key]);
//   const right = arr.filter((x) => x[key] > pivot[key]);

//   return [...quickSort(left, key), ...middle, ...quickSort(right, key)];
// };

// const merge = (left, right, key) => {
//   const result = [];
//   let leftIndex = 0;
//   let rightIndex = 0;

//   while (leftIndex < left.length && rightIndex < right.length) {
//     if (left[leftIndex][key] < right[rightIndex][key]) {
//       result.push(left[leftIndex]);
//       leftIndex++;
//     } else {
//       result.push(right[rightIndex]);
//       rightIndex++;
//     }
//   }

//   return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
// };

// const mergeSort = (arr, key) => {
//   if (arr.length <= 1) return arr;

//   const mid = Math.floor(arr.length / 2);
//   const left = arr.slice(0, mid);
//   const right = arr.slice(mid);

//   return merge(mergeSort(left, key), mergeSort(right, key), key);
// };

// module.exports = { quickSort, mergeSort };
