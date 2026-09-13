# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Attractions V2

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

Explore attractions is on Trip Details, between Notes and Expenses.
Hide/View preserves the mounted search and makes no requests.
Destination coordinates are resolved through the existing city service.

Search runs only after an explicit Search action. Changing controls
does not issue a search. Available search radii are 10, 25, and 50 km
around the destination.

Each Places request loads up to 20 BASE results. Initially only three cards
are revealed, with Details requested only for those uncached cards.
Load 3 more explicitly reveals/enriches at most three more cards.
Hidden base results never automatically request Details. Cached details
are reused without another provider request. Failed Details leave base cards
usable and are not retried during the active search session.

Per Page offers 3 / 6 / 9 (default 9). Page changes start with at most three
cards; changing Per Page resets to page one without a Places search.
Next becomes available only after the current page capacity is fully revealed
and another page can exist. Provider pagination follows actual reveal demand,
not page capacity. Each explicit action can fetch at most one additional
Places batch, with no prefetch loops. Offsets advance by RAW response count
before normalization or place-ID deduplication.

Category is a closed searchable combobox: typing filters valid labels locally
using case-insensitive startsWith matching. Invalid text disables Search.
Recommended choices appear first, followed by the full supported A-Z catalog.
Labels use friendly category names with concise parent context. Exact standalone
Recommended duplicates are omitted from the full catalog; specific children remain.
The documented Geoapify MCP `list_place_categories` tool loads lazily on first
focus/open, through the same request manager. Its public memory/localStorage
cache expires after seven days, preserving timestamps on hydration. Invalid
persisted entries are removed. Catalog failure leaves Recommended choices usable;
typing never makes Places calls. Nature & Parks excludes `highway.path`;
Nature Reserves & Hiking Trails includes it.

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

Add to itinerary navigates to the existing itinerary route with a minimal
normalized attractionDraft in React Router state. The itinerary page validates
and consumes it, then replaces navigation state to prevent refresh/back replay,
preserving unrelated state. Invalid drafts are discarded too.
It opens the existing form prefilled and defaults to
Plan Later. Unknown prices remain blank. If the user enters a positive
cost, the existing itinerary/expense transaction handles creation.

### Card content

Images, descriptions, and websites appear only when returned and usable.
Missing or failed images use a category fallback. Opening hours, ratings,
reviews, and invented prices are not displayed.

Navigate offers Waze or Google Maps using the attraction coordinates.
Distances are labelled from the search center, or from the user after
they explicitly allow location access.

