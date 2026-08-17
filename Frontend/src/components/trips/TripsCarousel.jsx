import {
    useRef,
    useState,
} from 'react'
import '../../css/components/trips-carousel.css'
import TripCard from './TripCard'

function ChevronIcon({
  direction,
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={
          direction === 'left'
            ? 'M15 6 9 12l6 6'
            : 'm9 6 6 6-6 6'
        }
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TripsCarousel({
  title,
  description,
  trips,
  status,
  countriesByCode,
}) {
  const trackRef = useRef(null)

  const [isExpanded, setIsExpanded] =
    useState(false)

  const [activeIndex, setActiveIndex] =
    useState(0)

  if (trips.length === 0) {
    return null
  }

  const hasMoreThanThree =
    trips.length > 3

  const hasMoreThanTwo =
    trips.length > 2

  const hasMultipleTrips =
    trips.length > 1

  const getCardStep = () => {
    const track = trackRef.current

    if (!track) {
      return 0
    }

    const firstCard =
      track.firstElementChild

    if (!firstCard) {
      return 0
    }

    const cardWidth =
      firstCard.getBoundingClientRect().width

    const styles =
      window.getComputedStyle(track)

    const gap =
      Number.parseFloat(styles.columnGap) ||
      Number.parseFloat(styles.gap) ||
      0

    return cardWidth + gap
  }

  const scrollPrevious = () => {
    const track = trackRef.current

    if (!track) {
      return
    }

    const step = getCardStep()

    if (!step) {
      return
    }

    const isAtStart =
      track.scrollLeft <= 2

    if (isAtStart) {
      track.scrollTo({
        left:
          track.scrollWidth -
          track.clientWidth,
        behavior: 'smooth',
      })

      return
    }

    track.scrollBy({
      left: -step,
      behavior: 'smooth',
    })
  }

  const scrollNext = () => {
    const track = trackRef.current

    if (!track) {
      return
    }

    const step = getCardStep()

    if (!step) {
      return
    }

    const isAtEnd =
      track.scrollLeft +
        track.clientWidth >=
      track.scrollWidth - 2

    if (isAtEnd) {
      track.scrollTo({
        left: 0,
        behavior: 'smooth',
      })

      return
    }

    track.scrollBy({
      left: step,
      behavior: 'smooth',
    })
  }

  const handleScroll = () => {
    const track = trackRef.current

    if (!track) {
      return
    }

    const step = getCardStep()

    if (!step) {
      return
    }

    const nextIndex = Math.min(
      trips.length - 1,
      Math.max(
        0,
        Math.round(
          track.scrollLeft / step,
        ),
      ),
    )

    setActiveIndex((currentIndex) =>
      currentIndex === nextIndex
        ? currentIndex
        : nextIndex,
    )
  }

  const toggleExpanded = () => {
    setIsExpanded((currentValue) => {
      const nextValue = !currentValue

      trackRef.current?.scrollTo({
        left: 0,
      })

      return nextValue
    })
  }

  return (
    <section
      className={`trips-carousel${
        isExpanded
          ? ' trips-carousel--expanded'
          : ''
      }${
        hasMoreThanThree
          ? ' trips-carousel--desktop-scrollable'
          : ''
      }${
        hasMoreThanTwo
          ? ' trips-carousel--tablet-scrollable'
          : ''
      }${
        hasMultipleTrips
          ? ' trips-carousel--mobile-scrollable'
          : ''
      }`}
      aria-labelledby={`trips-carousel-${status}`}
    >
      <div className="trips-carousel__header">
        <div className="trips-carousel__heading">
          <div className="trips-carousel__title-row">
            <h2
              id={`trips-carousel-${status}`}
              className="trips-carousel__title"
            >
              {title}
            </h2>

            <span className="trips-carousel__count">
              {trips.length}
            </span>
          </div>

          <p className="trips-carousel__description">
            {description}
          </p>
        </div>

        <div className="trips-carousel__header-actions">
          {hasMoreThanThree && (
            <button
              className="trips-carousel__view-all"
              type="button"
              onClick={toggleExpanded}
              aria-expanded={isExpanded}
            >
              {isExpanded
                ? 'Show less'
                : 'View all'}
            </button>
          )}

          <div className="trips-carousel__desktop-controls">
            <button
              className="trips-carousel__arrow"
              type="button"
              onClick={scrollPrevious}
              aria-label={`Previous ${title.toLowerCase()}`}
            >
              <ChevronIcon direction="left" />
            </button>

            <button
              className="trips-carousel__arrow"
              type="button"
              onClick={scrollNext}
              aria-label={`Next ${title.toLowerCase()}`}
            >
              <ChevronIcon direction="right" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="trips-carousel__track"
        onScroll={handleScroll}
      >
        {trips.map((trip) => {
          const countryCode =
            trip.destinationCountryCode
              ?.toUpperCase()

          const country =
            countriesByCode.get(countryCode)

          return (
            <TripCard
              key={trip.id}
              trip={trip}
              status={status}
              flagUrl={country?.flagUrl ?? ''}
            />
          )
        })}
      </div>

      <div className="trips-carousel__mobile-navigation">
        <button
          className="trips-carousel__mobile-arrow"
          type="button"
          onClick={scrollPrevious}
          aria-label={`Previous ${title.toLowerCase()}`}
        >
          <ChevronIcon direction="left" />
        </button>

        <span
          className="trips-carousel__mobile-counter"
          aria-live="polite"
        >
          {activeIndex + 1} / {trips.length}
        </span>

        <button
          className="trips-carousel__mobile-arrow"
          type="button"
          onClick={scrollNext}
          aria-label={`Next ${title.toLowerCase()}`}
        >
          <ChevronIcon direction="right" />
        </button>
      </div>
    </section>
  )
}

export default TripsCarousel