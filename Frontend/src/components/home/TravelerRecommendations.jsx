import '../../css/components/traveler-recommendations.css'

const recommendations = [
  {
    id: 1,
    name: 'Yael A.',
    location: 'Tel Aviv, Israel',
    text: 'Travel Planner helped us keep our entire vacation organized in one place. Everything was simple and easy to follow.',
  },
  {
    id: 2,
    name: 'Roi D.',
    location: 'Haifa, Israel',
    text: 'Having the destination, dates and trip details together made planning much easier and saved us a lot of time.',
  },
  {
    id: 3,
    name: 'Noa K.',
    location: 'Jerusalem, Israel',
    text: 'A clean and simple way to organize a trip. It made the whole planning process feel much more manageable.',
  },
]

function QuoteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7.4 6C4.4 7.9 3 10.1 3 13.3 3 16.2 4.7 18 7 18c2 0 3.5-1.4 3.5-3.4 0-1.9-1.4-3.2-3.2-3.2-.4 0-.8.1-1.1.2.3-1.4 1.2-2.7 2.8-3.8L7.4 6Zm9 0C13.4 7.9 12 10.1 12 13.3c0 2.9 1.7 4.7 4 4.7 2 0 3.5-1.4 3.5-3.4 0-1.9-1.4-3.2-3.2-3.2-.4 0-.8.1-1.1.2.3-1.4 1.2-2.7 2.8-3.8L16.4 6Z" />
    </svg>
  )
}

function TravelerRecommendations() {
  return (
    <section className="traveler-recommendations">
      <h2 className="traveler-recommendations__title">
        Traveler recommendations
      </h2>

      <div className="traveler-recommendations__grid">
        {recommendations.map(
          (recommendation) => (
            <article
              key={recommendation.id}
              className="traveler-recommendations__card"
            >
              <div className="traveler-recommendations__top">
                <div
                  className="traveler-recommendations__stars"
                  aria-label="5 out of 5 stars"
                >
                  ★★★★★
                </div>

                <span
                  className="traveler-recommendations__quote"
                  aria-hidden="true"
                >
                  <QuoteIcon />
                </span>
              </div>

              <p className="traveler-recommendations__text">
                {recommendation.text}
              </p>

              <div className="traveler-recommendations__person">
                <div
                  className="traveler-recommendations__avatar"
                  aria-hidden="true"
                >
                  {recommendation.name[0]}
                </div>

                <div>
                  <p className="traveler-recommendations__name">
                    {recommendation.name}
                  </p>

                  <p className="traveler-recommendations__location">
                    {recommendation.location}
                  </p>
                </div>
              </div>
            </article>
          ),
        )}
      </div>
    </section>
  )
}

export default TravelerRecommendations