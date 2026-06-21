import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { evaluateGuess, type LetterStatus } from '@/lib/wordleEngine'
import { VALID_GUESSES } from '@/lib/wordList'

const MAX_GUESSES = 6
const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

const statusClasses: Record<LetterStatus | 'empty' | 'filled', string> = {
  correct: 'bg-emerald-500 border-emerald-500 text-white',
  present: 'bg-amber-500 border-amber-500 text-white',
  absent: 'bg-surface-600 border-surface-600 text-white/70',
  filled: 'border-white/30 text-white',
  empty: 'border-white/10 text-white',
}

interface WordleBoardProps {
  target: string
  onSolved: () => void
  onFailed: () => void
  disabled?: boolean
}

export function WordleBoard({ target, onSolved, onFailed, disabled }: WordleBoardProps) {
  const [guesses, setGuesses] = useState<string[]>([])
  const [results, setResults] = useState<LetterStatus[][]>([])
  const [current, setCurrent] = useState('')
  const [shakeRow, setShakeRow] = useState(-1)
  const [invalidWord, setInvalidWord] = useState(false)
  const [keyStatus, setKeyStatus] = useState<Record<string, LetterStatus>>({})

  const submitGuess = useCallback(() => {
    if (current.length !== 5) {
      setShakeRow(guesses.length)
      setTimeout(() => setShakeRow(-1), 400)
      return
    }
    if (!VALID_GUESSES.has(current)) {
      setShakeRow(guesses.length)
      setInvalidWord(true)
      setTimeout(() => setShakeRow(-1), 400)
      setTimeout(() => setInvalidWord(false), 1200)
      return
    }
    const evaluation = evaluateGuess(current, target)
    const nextGuesses = [...guesses, current]
    const nextResults = [...results, evaluation]
    setGuesses(nextGuesses)
    setResults(nextResults)

    setKeyStatus((prev) => {
      const next = { ...prev }
      current.split('').forEach((ch, i) => {
        const status = evaluation[i]
        const rank: Record<LetterStatus, number> = { absent: 0, present: 1, correct: 2 }
        if (!next[ch] || rank[status] > rank[next[ch]]) next[ch] = status
      })
      return next
    })

    setCurrent('')

    if (current === target) {
      onSolved()
    } else if (nextGuesses.length >= MAX_GUESSES) {
      onFailed()
    }
  }, [current, guesses, results, target, onSolved, onFailed])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (disabled) return
      if (e.key === 'Enter') submitGuess()
      else if (e.key === 'Backspace') setCurrent((c) => c.slice(0, -1))
      else if (/^[a-zA-Z]$/.test(e.key)) setCurrent((c) => (c.length < 5 ? c + e.key.toLowerCase() : c))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [submitGuess, disabled])

  function handleVirtualKey(key: string) {
    if (disabled) return
    if (key === 'enter') submitGuess()
    else if (key === 'back') setCurrent((c) => c.slice(0, -1))
    else setCurrent((c) => (c.length < 5 ? c + key : c))
  }

  const rows = Array.from({ length: MAX_GUESSES }, (_, i) => {
    if (i < guesses.length) return { letters: guesses[i].split(''), result: results[i] }
    if (i === guesses.length) return { letters: current.padEnd(5).split(''), result: null }
    return { letters: ['', '', '', '', ''], result: null }
  })

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-5 text-sm font-semibold text-red-400">
        {invalidWord && 'Not in word list'}
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((row, ri) => (
          <motion.div
            key={ri}
            animate={shakeRow === ri ? { x: [0, -8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.35 }}
            className="flex gap-1.5"
          >
            {row.letters.map((letter, ci) => (
              <div
                key={ci}
                className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 text-xl font-bold uppercase sm:h-14 sm:w-14 ${
                  row.result ? statusClasses[row.result[ci]] : letter.trim() ? statusClasses.filled : statusClasses.empty
                }`}
              >
                {letter.trim()}
              </div>
            ))}
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1">
            {ri === 2 && (
              <button
                onClick={() => handleVirtualKey('enter')}
                className="rounded-md bg-surface-600 px-2 py-3 text-xs font-bold text-white"
              >
                ENTER
              </button>
            )}
            {row.split('').map((k) => (
              <button
                key={k}
                onClick={() => handleVirtualKey(k)}
                className={`rounded-md px-2.5 py-3 text-sm font-bold uppercase sm:px-3 ${
                  keyStatus[k] ? statusClasses[keyStatus[k]] : 'bg-surface-700 text-white hover:bg-surface-600'
                }`}
              >
                {k}
              </button>
            ))}
            {ri === 2 && (
              <button
                onClick={() => handleVirtualKey('back')}
                className="rounded-md bg-surface-600 px-2 py-3 text-xs font-bold text-white"
              >
                ⌫
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
