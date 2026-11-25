import { ArrowRight, Search, Sparkles } from 'lucide-react'
import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { toast } from 'sonner'

export const searchPrompts = [
  '3 BHK apartment in Noida under ₹90 lakh',
  'Furnished 2 BHK for rent in Delhi',
  'Family home with parking and a garden',
]

interface NaturalLanguageSearchProps {
  initialQuery?: string
  onSearch: (query: string) => void
  compact?: boolean
  suggestions?: string[]
  busy?: boolean
}

export function NaturalLanguageSearch({
  initialQuery = '',
  onSearch,
  compact = false,
  suggestions = searchPrompts,
  busy = false,
}: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState(initialQuery)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = query.trim()
    if (trimmed.length < 3) {
      toast.error('Tell us a little more — searches need at least 3 characters.')
      return
    }
    if (trimmed.length > 500) {
      toast.error('Please keep your search under 500 characters.')
      return
    }
    onSearch(trimmed)
  }

  function handlePromptKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <div className={`natural-search ${compact ? 'natural-search-compact' : ''}`}>
      <form className="natural-search-form" onSubmit={submit}>
        <div className="natural-search-topline">
          <span className="ai-orb"><Sparkles size={16} /></span>
          <span>Tell us what you’re looking for</span>
          <span className="natural-search-hint">IN PLAIN LANGUAGE</span>
        </div>
        <label className="sr-only" htmlFor={compact ? 'search-prompt-compact' : 'search-prompt'}>Describe your ideal property</label>
        <textarea
          id={compact ? 'search-prompt-compact' : 'search-prompt'}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handlePromptKey}
          placeholder={'“A bright 3 BHK near metro in Noida, under ₹90 lakh…”'}
          maxLength={500}
          rows={compact ? 2 : 3}
          aria-describedby="natural-search-hint"
        />
        <div className="natural-search-bottom">
          <span id="natural-search-hint" className="natural-search-count">{query.length}/500 · Press ⌘/Ctrl + Enter</span>
          <button className="btn btn-primary natural-search-submit" type="submit" disabled={busy}>
            {busy ? <span className="button-spinner" /> : <Search size={16} />}
            {busy ? 'Finding homes…' : 'Find my home'}
            {!busy && <ArrowRight size={15} />}
          </button>
        </div>
      </form>
      {suggestions.length > 0 && (
        <div className="prompt-suggestions">
          <span>Try</span>
          {suggestions.map((prompt) => (
            <button type="button" className="prompt-chip" key={prompt} onClick={() => setQuery(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
