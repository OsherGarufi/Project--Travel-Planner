import { useId } from 'react'
import { resolveCategory } from '../../services/attractions/attractionCategories'
import AttractionCategoryCombobox from './AttractionCategoryCombobox'

export default function AttractionsFilters({
  filters, onChange, onSearch, disabled, searching, userId, perPage, onPerPageChange,
}) {
  const id = useId()
  const cannotSearch = disabled || searching || !resolveCategory(filters.category)
  return (
    <form className="attractions-filters" onSubmit={(event) => {
      event.preventDefault()
      if (!cannotSearch) onSearch()
    }}>
      <div className="attractions-filters__search-row">
        <AttractionCategoryCombobox value={filters.category} userId={userId}
          onChange={(category) => onChange({ ...filters, category })} />
        <label htmlFor={id + '-radius'}>Radius
          <select id={id + '-radius'} value={filters.radius}
            onChange={(event) => onChange({ ...filters, radius: Number(event.target.value) })}>
            <option value={10000}>10 km</option>
            <option value={25000}>25 km</option>
            <option value={50000}>50 km</option>
          </select>
        </label>
        <label htmlFor={id + '-per-page'}>Per Page
          <select id={id + '-per-page'} value={perPage}
            onChange={(event) => onPerPageChange(Number(event.target.value))}>
            {[3, 6, 9].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <button type="submit" className="attractions-button attractions-button--primary" disabled={cannotSearch}>
          {searching ? 'Searching...' : 'Search attractions'}
        </button>
      </div>
    </form>
  )
}