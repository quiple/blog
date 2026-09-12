// PCM correlation at 4 kHz; all offsets use target time minus reference time.
export const sampleRate = 4000
const hop = 40
function envelope(pcm: Float32Array) {
  const result = new Float32Array(Math.floor(pcm.length / hop))
  for (let i = 0; i < result.length; i++) {
    let sum = 0
    for (let j = 0; j < hop; j++) sum += pcm[i * hop + j] ** 2
    result[i] = Math.log(1e-7 + sum / hop)
  }
  return result
}
function correlation(a: Float32Array, ai: number, b: Float32Array, bi: number, length: number, step = 1) {
  let x = 0,
    y = 0,
    xx = 0,
    yy = 0,
    xy = 0,
    n = 0
  for (let j = 0; j < length; j += step) {
    const av = a[ai + j],
      bv = b[bi + j]
    x += av
    y += bv
    xx += av * av
    yy += bv * bv
    xy += av * bv
    n++
  }
  const denominator = Math.sqrt(Math.max(0, (xx - (x * x) / n) * (yy - (y * y) / n)))
  return denominator > 1e-10 ? (xy - (x * y) / n) / denominator : 0
}
export function compareAudio(reference: Float32Array, target: Float32Array) {
  const a = envelope(reference),
    b = envelope(target)
  const length = Math.min(800, Math.floor(Math.min(a.length, b.length) / 3))
  if (length < 200) throw new Error('비교하려면 양쪽에 최소 6초의 오디오가 필요합니다.')
  const matches: {at: number; offset: number; score: number}[] = []
  for (const fraction of [0.05, 0.25, 0.45, 0.65, 0.85]) {
    const start = Math.floor((Math.min(a.length, b.length) - length) * fraction)
    let best = -1,
      bestIndex = 0
    const scores: number[] = []
    for (let i = 0; i <= b.length - length; i++) {
      const score = correlation(a, start, b, i, length, 2)
      scores.push(score)
      if (score > best) {
        best = score
        bestIndex = i
      }
    }
    const alternative = Math.max(-1, ...scores.filter((_, i) => Math.abs(i - bestIndex) > 50))
    if (best < 0.65 || best - alternative < 0.025) continue
    let fineScore = 0,
      fineIndex = bestIndex * hop
    const samples = length * hop
    for (
      let i = Math.max(0, fineIndex - 160), end = Math.min(target.length - samples, fineIndex + 160);
      i <= end;
      i++
    ) {
      const score = Math.abs(correlation(reference, start * hop, target, i, samples, 2))
      if (score > fineScore) {
        fineScore = score
        fineIndex = i
      }
    }
    if (fineScore < 0.35) continue
    matches.push({at: start / 100, offset: (fineIndex - start * hop) / sampleRate, score: fineScore})
  }
  const ordered = matches.map((match) => match.offset).sort((a, b) => a - b)
  const spread = ordered.length ? ordered.at(-1)! - ordered[0] : Infinity
  const stable = matches.length >= 3 && spread <= 0.025
  return {
    matches,
    stable,
    offset: stable ? Math.round(ordered[Math.floor(ordered.length / 2)] * 1000) / 1000 : undefined,
  }
}
