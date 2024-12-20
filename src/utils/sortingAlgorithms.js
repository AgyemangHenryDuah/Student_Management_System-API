const quickSort = (arr, key) => {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter((x) => x[key] < pivot[key]);
  const middle = arr.filter((x) => x[key] === pivot[key]);
  const right = arr.filter((x) => x[key] > pivot[key]);

  return [...quickSort(left, key), ...middle, ...quickSort(right, key)];
};

const merge = (left, right, key) => {
  const result = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex][key] < right[rightIndex][key]) {
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
