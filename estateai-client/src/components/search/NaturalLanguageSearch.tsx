import { ArrowRight, Check, Command, Search, Sparkles } from 'lucide-react'
import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { toast } from 'sonner'

const searchPrompts = [
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
  const instanceId = useId()
  const promptId = compact ? 'search-prompt-compact' : `search-prompt-${instanceId}`
  const hintId = `search-prompt-hint-${instanceId}`
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  function chooseSuggestion(prompt: string) {
    setQuery(prompt)
    textareaRef.current?.focus()
  }

  return (
    <div className={`natural-search ${compact ? 'natural-search-compact' : ''}`}>
      <div className="natural-search-header">
        <span className="natural-search-orb"><Sparkles size={18} /></span>
        <div className="natural-search-heading">
          <strong>Tell us what you’re looking for</strong>
          <span>Write it naturally. Add a location, budget, or must-have.</span>
        </div>
        <span className="natural-search-hint"><Sparkles size={12} /> PLAIN-LANGUAGE SEARCH</span>
      </div>
      <form className="natural-search-form" onSubmit={submit}>
        <div className="natural-search-input">
          <label className="natural-search-label" htmlFor={promptId}>Describe your ideal property</label>
          <div className="natural-search-textarea-wrap">
            <textarea
              ref={textareaRef}
              id={promptId}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handlePromptKey}
              placeholder={'“A bright 3 BHK near metro in Noida, under ₹90 lakh…”'}
              maxLength={500}
              rows={compact ? 2 : 3}
              aria-describedby={hintId}
            />
            <span className="natural-search-input-mark" aria-hidden="true"><Search size={16} /></span>
          </div>
        </div>
        <div className="natural-search-bottom">
          <div className="natural-search-assist">
            <span id={hintId} className="natural-search-count">{query.length}/500 characters</span>
            <span className="natural-search-shortcut"><Command size={12} /> Enter to search</span>
          </div>
          <button className="btn btn-primary natural-search-submit" type="submit" disabled={busy}>
            {busy ? <span className="button-spinner" /> : <Search size={16} />}
            {busy ? 'Finding homes…' : 'Search homes'}
            {!busy && <ArrowRight size={15} />}
          </button>
        </div>
      </form>
      {suggestions.length > 0 && (
        <div className="prompt-suggestions">
          <div className="prompt-suggestions-label"><span>Try a search like</span><Check size={13} /></div>
          {suggestions.map((prompt) => (
            <button
              type="button"
              className={`prompt-chip ${query === prompt ? 'selected' : ''}`}
              key={prompt}
              aria-pressed={query === prompt}
              onClick={() => chooseSuggestion(prompt)}
            >
              <span>{prompt}</span><ArrowRight size={13} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
