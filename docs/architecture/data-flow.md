# Travel Planner — Data Flow

## 1. Overview

Travel Planner has several distinct data paths rather than one universal request flow. Authentication, user-owned data, trip planning, itinerary and expense synchronization, attractions, and AI features each cross different application boundaries. Some public-data providers are accessed directly by the browser, while protected data, persistence, ownership checks, and AI operations pass through the ASP.NET Core API.

## 2. Authentication and Local User Synchronization

```mermaid
sequenceDiagram
    actor User
    participant React
    participant Firebase as Firebase Authentication
    participant API as ASP.NET Core API
    participant Admin as Firebase Admin
    participant DB as PostgreSQL

    User->>React: Sign in with Google or email/password
    React->>Firebase: Submit authentication request
    Firebase-->>React: Firebase user and ID token
    React->>API: POST /api/Auth/login with ID token
    API->>Admin: Verify ID token
    Admin-->>API: Verified UID and token claims
    API->>API: Extract UID, email, name, and photo
    API->>DB: Create or update local users record
    DB-->>API: Local application user
    API-->>React: Local application user
    React->>React: AuthProvider stores authentication and application state
```

`AuthProvider` subscribes to Firebase's `onIdTokenChanged` event. This restores authenticated sessions after a page load and repeats backend synchronization when Firebase supplies a refreshed token. The backend verifies the supplied token directly through Firebase Admin; this flow does not use ASP.NET authentication middleware or `[Authorize]`.

## 3. Authenticated Trip Data Flow

```mermaid
sequenceDiagram
    participant Page as React Page
    participant State as Feature Hook / TripsProvider
    participant Client as Frontend Service
    participant API as ASP.NET Core API
    participant Current as CurrentUserService
    participant Admin as Firebase Admin
    participant Domain as DAL / Service
    participant DB as PostgreSQL

    Page->>State: Request or mutate user-owned data
    State->>Client: Call feature service
    Client->>API: API request with Authorization: Bearer Firebase ID token
    API->>Current: Resolve current local user
    Current->>Admin: Verify Firebase ID token
    Admin-->>Current: Verified Firebase UID
    Current->>DB: Find user by Firebase UID
    DB-->>Current: Local AppUser
    Current-->>API: AppUser with local UUID
    API->>Domain: Execute operation scoped by AppUser.Id
    Domain->>DB: Parameterized SQL with user ownership filter
    DB-->>Domain: User-scoped result
    Domain-->>API: Domain result
    API-->>Client: HTTP response
    Client-->>State: Normalized result
    State->>State: Reconcile user-scoped cache
    State-->>Page: Render current state
```

The local `AppUser.Id` is carried into database and business-service operations. This same ownership pattern protects trip reads and mutations, itinerary operations, and expense operations. Resource queries include the owning user—directly or through the trip relationship—rather than trusting a resource identifier supplied by the browser on its own.

## 4. Trip Creation Flow

```mermaid
flowchart LR
    Country[Country selection] -->|Backend REST Countries data| Cities[Major cities or city search]
    Cities -->|Backend GeoDB data| Weather[Browser weather lookup]
    Weather -->|Open-Meteo| Dates[Travel dates]
    Dates --> Budget[Budget and currency]
    Budget -->|Browser uses Frankfurter for conversion| Submit[POST /api/Trips]
    Submit --> API[ASP.NET Core API]
    API -->|Owned trip insert| DB[(PostgreSQL)]
    DB --> Created[Created trip response]
    Created --> Cache[TripsProvider cache update]
    Cache --> Details[Trip Details]
```

Countries and cities are requested through backend destination endpoints. Weather forecasts and historical data are fetched directly from Open-Meteo by the browser. Currency rates are fetched directly from Frankfurter by the browser. The completed trip payload is then sent to the protected backend endpoint, persisted under the local user's ID, added to the `TripsProvider` state and cache, and used to open the new trip's details view.

## 5. Itinerary and Expense Synchronization

```mermaid
flowchart TB
    Form[React trip entry form] --> Cost{Positive cost?}

    Cost -->|No| FreeAPI[Itinerary API]
    FreeAPI --> FreeTx[Create itinerary item]
    FreeTx --> FreeItem[(trip_itinerary_items)]

    Cost -->|Yes| PaidAPI[Backend itinerary/expense orchestration]
    PaidAPI --> Tx[PostgreSQL transaction]
    Tx --> Expense[(trip_expenses)]
    Tx --> PaidItem[(trip_itinerary_items)]
    Expense -->|expense_id link| PaidItem

    Existing[Edit existing linked or unlinked entry] --> Transition{Relationship transition}
    Transition -->|Free to paid| CreateLink[Create expense and link item]
    Transition -->|Paid to free| RemoveLink[Remove linked expense and retain item]
    Transition -->|Paid to paid| SyncBoth[Update item and linked expense]
    Transition -->|Linked delete or update| Coordinated[Keep linked records synchronized]

    CreateLink --> EditTx[PostgreSQL transaction]
    RemoveLink --> EditTx
    SyncBoth --> EditTx
    Coordinated --> EditTx
```

A free activity creates only an itinerary item. An activity with a positive cost is handled by backend orchestration that creates the expense and itinerary item in one transaction and stores the relationship through `trip_itinerary_items.expense_id`.

The same orchestration supports free-to-paid, paid-to-free, and paid-to-paid transitions. Updates and deletions involving linked records are coordinated so the activity and expense do not drift apart. Operations affecting both tables use PostgreSQL transactions and roll back when the combined operation cannot complete.

## 6. Attractions Flow

```mermaid
flowchart LR
    Trip[Trip destination city] --> CityAPI[Backend city lookup]
    CityAPI --> Coordinates[Validated city coordinates]
    Coordinates --> Geoapify[Direct browser request to Geoapify]
    Geoapify --> Results[Attraction search results]
    Results --> Details[Optional details enrichment]
    Details --> Add[Add to itinerary]
    Add --> Router[React Router attraction draft state]
    Router --> Form[Prefilled itinerary form]
    Form --> Save{User submits?}
    Save -->|No| Temporary[No application record created]
    Save -->|Yes| Itinerary[Normal itinerary creation flow]
    Itinerary --> Cost{Positive cost?}
    Cost -->|No| Item[Persist itinerary item]
    Cost -->|Yes| Linked[Persist itinerary item and linked expense]
```

The frontend first calls the backend city-search endpoint to resolve the trip's stored city and country to an unambiguous coordinate pair. It then calls Geoapify directly from the browser for nearby attractions and, when needed, additional place details.

Search results are cached for discovery but are not application records and are not persisted to PostgreSQL. Selecting **Add to itinerary** transfers a sanitized attraction draft through React Router state and opens the normal itinerary-entry form. Persistence occurs only after the user submits that form. A positive cost follows the paid-activity workflow and can create a linked expense in the same transaction.

## 7. AI Data Flows

### Trip Notes Organization

```mermaid
sequenceDiagram
    participant React
    participant API as Protected ASP.NET endpoint
    participant Ownership as Ownership check
    participant Gemini as Google Gemini

    React->>API: Submit current notes for organization
    API->>Ownership: Resolve user and verify trip ownership
    Ownership-->>API: Owned trip confirmed
    API->>Gemini: Request structured note organization
    Gemini-->>API: Structured response
    API-->>React: Formatted organized notes
    React->>React: Preview or apply result to editable draft
    Note over React,API: The user must separately save the edited trip notes
```

AI organization does not automatically update the trip. The organized result is returned to React for preview and can replace the editable draft only when the user applies it. Saving remains a separate protected trip update.

### Daily Travel Tip

```mermaid
sequenceDiagram
    participant React
    participant Home as Home API
    participant Memory as IMemoryCache
    participant DB as PostgreSQL
    participant Gemini as Google Gemini

    React->>Home: GET /api/Home/daily-travel-tip
    Home->>Memory: Look up today's tip
    alt Memory hit
        Memory-->>Home: Today's tip
    else Memory miss
        Home->>DB: Look up today's persisted tip
        alt Stored tip exists
            DB-->>Home: Today's tip
            Home->>Memory: Cache until the next UTC day
        else Generation required
            Home->>Gemini: Generate structured daily tips
            Gemini-->>Home: Validated tip batch
            Home->>DB: Persist dated tips
            Home->>Memory: Cache today's tip
        end
    end
    Home-->>React: Daily travel tip
```

The daily-tip flow checks process memory and persistent storage before calling Gemini. Generation is shared so concurrent requests do not produce duplicate batches. When generation is temporarily unavailable or a concurrent persistence attempt cannot supply today's result, the service can return the most recent stored older tip as a fallback.

## 8. Cache and Request Coordination

Caching and coordination participate throughout these flows rather than forming a separate subsystem.

Frontend behavior includes:

- User-scoped `localStorage` caches for private trip, itinerary, expense, and attraction state where applicable.
- `sessionStorage` caches for shorter-lived country, city, weather, and currency data.
- In-memory caches for fast reuse during the current application session.
- Shared in-flight requests and request deduplication.
- `AbortController` cancellation when selections, views, or sessions change.
- Session, generation, and request guards that reject stale responses.
- Optimistic itinerary scheduling followed by reconciliation with confirmed backend state.

Backend behavior includes:

- `IMemoryCache` for reusable country, city, and daily-tip data.
- Shared in-flight work so concurrent provider requests can reuse the same operation.
- Serialized pacing of GeoDB requests to respect the provider's request rate.
- PostgreSQL-backed daily travel tips combined with process-memory caching.

Backend memory caches are instance-local; persistent daily tips remain available across process restarts.

## 9. Data Ownership Boundary

```mermaid
flowchart LR
    Firebase[Firebase UID] --> User[Local users.id UUID]
    User --> Trip[trips.user_id]
    Trip --> Itinerary[Itinerary items through trip ownership]
    Trip --> Expenses[Expenses through trip ownership]
```

Firebase identity is not used directly as the database ownership key. After token verification, the Firebase UID resolves to the application's local `users.id` UUID. That UUID owns trips through `trips.user_id`; itinerary items and expenses inherit the ownership boundary through their parent trip.
