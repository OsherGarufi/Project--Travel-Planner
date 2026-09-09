import { useId } from 'react'
import { ATTRACTION_CATEGORIES } from '../../services/attractions/attractionsService'

export default function AttractionsFilters({ filters, onChange, onSearch, disabled, searching }) {
  const radiusId = useId()
  return (
    <form className="attractions-filters" onSubmit={(event) => {
      event.preventDefault()
      onSearch()
    }}>
      <fieldset className="attractions-filters__categories">
        <legend>What would you like to explore?</legend>
        <div className="attractions-filters__chips">
          {ATTRACTION_CATEGORIES.map((category) => (
            <button type="button" key={category}
              className="attractions-filters__chip"
              aria-pressed={filters.category === category}
              onClick={() => onChange({ ...filters, category })}>
              {category}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="attractions-filters__search-row">
        <label htmlFor={radiusId}>Search radius
          <select id={radiusId} value={filters.radius}
            onChange={(event) => onChange({ ...filters, radius: Number(event.target.value) })}>
            <option value={10000}>10 km</option>
            <option value={25000}>25 km</option>
            <option value={50000}>50 km</option>
          </select>
        </label>
        <button type="submit" className="attractions-button attractions-button--primary" disabled={disabled}>
          {searching ? 'Search again' : 'Search attractions'}
        </button>
      </div>
    </form>
  )
}
