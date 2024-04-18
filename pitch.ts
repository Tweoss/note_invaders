const sum = (array: Float32Array) => array.reduce((a, v) => a + v, 0);
const skip_while = (
  array: Float32Array | any[],
  predicate,
): Float32Array | any[] => {
  const index = array.findIndex((e) => !predicate(e));
  return array.slice(Math.max(index, 0));
};
const zip = (a: number[], b: number[]): [number, number][] =>
  a.map((e, i) => [e, b[i]]);
const max_index_by = (array: any[], left_greater) =>
  array.reduce((acc, e, i) => (left_greater(array[acc], e) ? acc : i), 0);

// See https://github.com/cwilso/PitchDetect/blob/main/js/pitchdetect.js
export function find_pitch(
  buffer: Float32Array,
  sample_rate: number,
): number | null {
  let root_mean_square = Math.sqrt(
    sum(buffer.map((v) => v * v)) / buffer.length,
  );
  // Ignore silence.
  if (root_mean_square < 0.01) {
    return null;
  }
  // Look for zero crossing.
  const is_nonzero = (v) => Math.abs(v) >= 0.2;
  buffer = skip_while(buffer, is_nonzero) as Float32Array;
  buffer = skip_while(buffer.reverse(), is_nonzero)
    .reverse()
    .slice(0, -1) as Float32Array;

  // Calculate autocorrelation.
  let counts = new Array(buffer.length).fill(0);
  for (const [i, _] of counts.entries()) {
    for (let j = 0; j < buffer.length - i; j++) {
      counts[i] += buffer[j] * buffer[j + i];
    }
  }

  // Skip where is small shift (will give false strong autocorrelation).
  const offset = zip(counts, counts.slice(1)).findIndex(
    ([el, succ]) => el <= succ,
  );
  let best_index = max_index_by(counts.slice(offset), (a, b) => a > b) + offset;
  // Corrections?
  const a =
    (counts[best_index - 1] + counts[best_index + 1] - 2 * counts[best_index]) /
    2;
  const b = (counts[best_index + 1] - counts[best_index - 1]) / 2;
  if (a) best_index -= b / (2 * a);

  return sample_rate / best_index;
}
