import { useEffect, useState } from 'react'

interface TypewriterTextProps {
  phrases: string[]
}

export function TypewriterText({ phrases }: TypewriterTextProps) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [text, setText] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? phrases[0] ?? ''
      : ''
  ))

  useEffect(() => {
    if (phrases.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const phrase = phrases[phraseIndex] ?? ''
    const isHolding = text === phrase
    const isTyping = text.length < phrase.length
    const timeout = window.setTimeout(() => {
      if (isHolding) {
        setText('')
        setPhraseIndex((current) => (current + 1) % phrases.length)
      } else if (isTyping) {
        setText(phrase.slice(0, text.length + 1))
      } else {
        setText((current) => current.slice(0, -1))
      }
    }, isHolding ? 1700 : isTyping ? 42 : 24)

    return () => window.clearTimeout(timeout)
  }, [phraseIndex, phrases, text])

  return <span aria-hidden="true">{text}</span>
}
