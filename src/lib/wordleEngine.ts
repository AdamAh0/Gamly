import { WORD_LIST } from '@/lib/wordList'

function hashSeed(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i)
    h |= 0
  }
  return h >>> 0
}

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministic word sequence shared by both players for a given match seed. */
export function generateWordSequence(seed: string, count = 200): string[] {
  const rng = mulberry32(hashSeed(seed))
  const pool = [...WORD_LIST]
  const sequence: string[] = []
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * pool.length)
    sequence.push(pool[idx])
  }
  return sequence
}

export type LetterStatus = 'correct' | 'present' | 'absent'

export function evaluateGuess(guess: string, target: string): LetterStatus[] {
  const result: LetterStatus[] = new Array(5).fill('absent')
  const targetChars = target.split('')
  const used = new Array(5).fill(false)

  for (let i = 0; i < 5; i++) {
    if (guess[i] === targetChars[i]) {
      result[i] = 'correct'
      used[i] = true
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue
    const idx = targetChars.findIndex((c, j) => !used[j] && c === guess[i])
    if (idx !== -1) {
      result[i] = 'present'
      used[idx] = true
    }
  }

  return result
}
