import {
    useEffect,
    useRef,
    useState,
} from 'react'
import homeBeachImage from '../../assets/homeBeach.png'
import photoCityImage from '../../assets/photoCity.png'
import photoClimbImage from '../../assets/photoClimb.png'
import photoNatureImage from '../../assets/photoNature.png'
import photoShoppingImage from '../../assets/photoShopping.png'
import photoVacationImage from '../../assets/photoVacation.png'
import '../../css/components/travel-carousel.css'

const slides = [
  {
    id: 'vacation',
    image: photoVacationImage,
    alt: 'Vacation written inside a heart drawn in the sand by the sea',
    label: 'Time for a vacation',
  },
  {
    id: 'beach',
    image: homeBeachImage,
    alt: 'Tropical beach with turquoise water and palm trees',
    label: 'Beach escapes',
  },
  {
    id: 'city',
    image: photoCityImage,
    alt: 'Beautiful European city at sunset',
    label: 'City adventures',
  },
  {
    id: 'nature',
    image: photoNatureImage,
    alt: 'Mountain landscape with a clear alpine lake',
    label: 'Nature journeys',
  },
  {
    id: 'climb',
    image: photoClimbImage,
    alt: 'Friends celebrating after reaching a mountain summit',
    label: 'Adventure trips',
  },
  {
    id: 'shopping',
    image: photoShoppingImage,
    alt: 'Friends enjoying a shopping trip on a beautiful city avenue',
    label: 'City and shopping',
  },
]

function ArrowIcon({ direction }) {
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

function TravelCarousel() {
  const [activeIndex, setActiveIndex] =
    useState(0)

  const touchStartXRef = useRef(null)

  const goToSlide = (index) => {
    setActiveIndex(index)
  }

  const showPreviousSlide = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === 0
        ? slides.length - 1
        : currentIndex - 1,
    )
  }

  const showNextSlide = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === slides.length - 1
        ? 0
        : currentIndex + 1,
    )
  }

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) =>
        currentIndex === slides.length - 1
          ? 0
          : currentIndex + 1,
      )
    }, 7000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const handleTouchStart = (event) => {
    touchStartXRef.current =
      event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event) => {
    if (touchStartXRef.current === null) {
      return
    }

    const touchEndX =
      event.changedTouches[0]?.clientX

    if (typeof touchEndX !== 'number') {
      touchStartXRef.current = null
      return
    }

    const swipeDistance =
      touchEndX - touchStartXRef.current

    if (Math.abs(swipeDistance) < 45) {
      touchStartXRef.current = null
      return
    }

    if (swipeDistance > 0) {
      showPreviousSlide()
    } else {
      showNextSlide()
    }

    touchStartXRef.current = null
  }

  return (
    <section
      className="travel-carousel"
      aria-label="Travel inspiration"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="travel-carousel__viewport">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`travel-carousel__slide${
              index === activeIndex
                ? ' travel-carousel__slide--active'
                : ''
            }`}
            aria-hidden={index !== activeIndex}
          >
            <img
              className="travel-carousel__image"
              src={slide.image}
              alt={
                index === activeIndex
                  ? slide.alt
                  : ''
              }
              draggable="false"
            />

            <div
              className="travel-carousel__overlay"
              aria-hidden="true"
            />

            <div className="travel-carousel__label">
              {slide.label}
            </div>
          </div>
        ))}

        <button
          className="travel-carousel__arrow travel-carousel__arrow--previous"
          type="button"
          onClick={showPreviousSlide}
          aria-label="Previous travel image"
        >
          <ArrowIcon direction="left" />
        </button>

        <button
          className="travel-carousel__arrow travel-carousel__arrow--next"
          type="button"
          onClick={showNextSlide}
          aria-label="Next travel image"
        >
          <ArrowIcon direction="right" />
        </button>

        <div
          className="travel-carousel__indicators"
          aria-label="Choose travel image"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              className={`travel-carousel__indicator${
                index === activeIndex
                  ? ' travel-carousel__indicator--active'
                  : ''
              }`}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Show ${slide.label}`}
              aria-current={
                index === activeIndex
                  ? 'true'
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default TravelCarousel