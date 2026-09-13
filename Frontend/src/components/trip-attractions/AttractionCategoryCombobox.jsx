import { useEffect, useId, useRef, useState } from 'react'
import {
  RECOMMENDED_OPTIONS, catalogOptions, loadCategoryCatalog, readCategoryCatalog,
} from '../../services/attractions/attractionCategories'

export default function AttractionCategoryCombobox({ value, onChange, userId }) {
  const id = useId()
  const root = useRef(null)
  const controller = useRef(null)
  const attempted = useRef(false)
  const [catalog, setCatalog] = useState(readCategoryCatalog)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(-1)
  const [status, setStatus] = useState('')
  const all = [...RECOMMENDED_OPTIONS, ...catalogOptions(catalog)]
  const selected = all.find((item) => item.value === value)
  const prefix = query.trim().toLowerCase().replace(/\s+/g, ' ')
  const options = all.filter((item) => item.label.toLowerCase().startsWith(prefix))

  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    const outside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [])
  useEffect(() => {
    if (open && active >= 0) {
      document.getElementById(id + '-option-' + active)?.scrollIntoView({ block: 'nearest' })
    }
  }, [active, id, open])

  const openList = () => {
    setOpen(true)
    if (attempted.current || !userId) return
    attempted.current = true
    controller.current = new AbortController()
    const signal = controller.current.signal
    setStatus('Loading full category catalog...')
    loadCategoryCatalog(userId, signal).then((categories) => {
      if (signal.aborted) return
      setCatalog(categories)
      setStatus('')
    }).catch((error) => {
      if (signal.aborted || error.name === 'AbortError') return
      setStatus('Full catalog unavailable. Recommended categories are still available.')
    })
  }
  const choose = (item) => {
    onChange(item.value)
    setQuery('')
    setOpen(false)
    setActive(-1)
  }

  return (
    <div className="attractions-category" ref={root} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
    }}>
      <label htmlFor={id}>Category</label>
      <input id={id} role="combobox" autoComplete="off"
        aria-autocomplete="list" aria-expanded={open} aria-controls={id + '-list'}
        aria-activedescendant={open && options[active] ? id + '-option-' + active : undefined}
        aria-invalid={!selected} aria-describedby={status ? id + '-status' : undefined}
        value={open ? query : selected?.label ?? query}
        placeholder={selected?.label ?? 'Choose a category'}
        onFocus={openList} onClick={openList}
        onChange={(event) => {
          setQuery(event.target.value)
          onChange(null)
          setActive(-1)
          setOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') { setOpen(false); return }
          if (event.key === 'Enter' && open) {
            event.preventDefault()
            if (options[active]) choose(options[active])
            return
          }
          if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
          if (!open && ['Home', 'End'].includes(event.key)) return
          event.preventDefault()
          openList()
          if (!options.length) return
          if (event.key === 'Home') setActive(0)
          else if (event.key === 'End') setActive(options.length - 1)
          else if (event.key === 'ArrowDown') setActive((index) => (index + 1) % options.length)
          else setActive((index) => index < 0 ? options.length - 1 : (index - 1 + options.length) % options.length)
        }} />
      {open && <div className="attractions-category__list" id={id + '-list'} role="listbox" aria-label="Attraction categories">
        {options.map((item, index) => <div key={item.value}>
          {!prefix && index === 0 && <div className="attractions-category__heading">Recommended</div>}
          {!prefix && index === RECOMMENDED_OPTIONS.length && <div className="attractions-category__heading">All categories A–Z</div>}
          <div id={id + '-option-' + index} role="option" aria-selected={item.value === value}
            className={'attractions-category__option' + (active === index ? ' is-active' : '') + (!prefix && item.child ? ' is-child' : '')}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => choose(item)}>
            {item.label}
          </div>
        </div>)}
        {!options.length && <div className="attractions-category__heading">No matching categories</div>}
      </div>}
      {status && <small id={id + '-status'} role="status">{status}</small>}
    </div>
  )
}