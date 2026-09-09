# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Attractions V1

Attractions uses the Geoapify Places API and Place Details API directly
from the browser. Requests do not pass through the ASP.NET backend.

### Configuration

For local development, configure `VITE_GEOAPIFY_API_KEY` in
`Frontend/.env.local`, then restart Vite. Do not commit the local
environment file or an actual API key.

Restrict the development key to the origin `http://localhost:5173`
in the Geoapify project settings. Production should use a separate
Geoapify key restricted to the production origin.

Vite `VITE_` variables are browser-visible. Origin restrictions are
required; a frontend environment variable does not make the key secret.

If the key is missing, Attractions displays a configuration message
and does not send provider requests.

### Search and details

Explore attractions is available on the trip itinerary page.
Destination coordinates are resolved through the existing city service.

Search runs only after an explicit Search action. Changing controls
does not issue a search. Available search radii are 10, 25, and 50 km
around the destination.

Each Places request returns up to 20 results. Base cards render first,
then receive Place Details automatically in progressive groups of four.
Cached details are merged without another provider request.
An individual Details failure leaves the base card available.

Show more explicitly requests the next page. Results are appended and
deduplicated by place ID; the next page is never prefetched.

Places and Details share client-side request management with in-flight
deduplication, cancellation, and pacing of at most five provider request
starts in a rolling one-second window per app instance. HTTP 429 responses
respect Retry-After when supplied, otherwise use a short cooldown, and
are retried at most once.

### Cache and persistence

Search and Details caches are scoped to the authenticated user and use
memory plus localStorage. Both expire after 24 hours. Hydrating memory
preserves the original cache timestamp.

The existing private-user cleanup flow invalidates pending Attractions
requests before clearing the user's caches on logout, account switching,
or auth-state clearing. Cancelled or stale responses cannot restore
cleared data.

Attraction search results are not persisted to the database. Only items
explicitly added by the user are persisted through the existing
TripEntryForm and itinerary creation flow.

Add to itinerary opens the existing form prefilled and defaults to
Plan Later. Unknown prices remain blank. If the user enters a positive
cost, the existing itinerary/expense transaction handles creation.

### Card content

Images, descriptions, and websites appear only when returned and usable.
Missing or failed images use a category fallback. Opening hours, ratings,
reviews, and invented prices are not displayed.

Navigate offers Waze or Google Maps using the attraction coordinates.
Distances are labelled from the search center, or from the user after
they explicitly allow location access.

