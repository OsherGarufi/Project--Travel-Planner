# Travel Planner — API Overview

## 1. Overview

Travel Planner's backend is an ASP.NET Core 9 REST API. Controllers exchange JSON request and response contracts, coordinate business services, and persist application data in PostgreSQL through Npgsql.

Protected requests carry Firebase ID tokens. The backend verifies the token, resolves the corresponding local application user, and separately enforces ownership of trips and their child resources. The current implementation performs these checks explicitly through `CurrentUserService`; it does not use ASP.NET Core `[Authorize]` attributes.

OpenAPI generation and Swagger UI are available when the backend runs in the Development environment. Swagger's Bearer-token input is API documentation and testing metadata; server enforcement remains the controller and `CurrentUserService` behavior described below.

## 2. Authentication Conventions

Protected requests send the current Firebase ID token in the HTTP header:

```http
Authorization: Bearer <Firebase ID token>
```

`CurrentUserService` extracts the Bearer value, asks `FirebaseAuthService` to verify it through Firebase Admin, and resolves the verified Firebase UID to a local `AppUser` record.

- Public endpoints do not require a Bearer header.
- Authenticated endpoints require a valid Firebase ID token and a corresponding local user.
- Resource ownership is checked separately after authentication, using the local `AppUser.Id`.
- A user ID supplied by the client is never used to establish ownership.

## 3. Auth Endpoints

### `POST /api/Auth/login`

Synchronizes an authenticated Firebase identity with the application's local `users` table.

- **Authentication:** Public bootstrap endpoint. The Firebase ID token is verified from the request body rather than from the Bearer header.
- **Request:** `LoginRequest`, summarized as:

  ```json
  {
    "idToken": "<Firebase ID token>"
  }
  ```

- **Processing:** Verifies the token, reads its UID and available `email`, `name`, and `picture` claims, and creates or updates the local user by Firebase UID.
- **Response:** `200 OK` with the local `AppUser` used by the frontend application state.
- **Other behavior:** Automatic model validation or a verified token without an email can produce `400 Bad Request`. Token-verification and other unexpected exceptions are handled by the global exception middleware as a generic `500` response.

## 4. Destination Endpoints

All destination endpoints are public.

### `GET /api/Destinations/countries`

- **Purpose:** Returns normalized country metadata obtained through the backend country service.
- **Parameters:** None.
- **Response:** `200 OK` with a collection of `CountryResponse` objects, including country code, name, flag, capital, currencies, languages, population, and region when available.

### `GET /api/Destinations/countries/{countryCode}/cities/major`

- **Purpose:** Returns major cities for a country through the backend GeoDB service.
- **Route parameter:** `countryCode`, exactly two letters.
- **Response:** `200 OK` with a collection of `CityResponse` objects.
- **Validation:** Invalid country codes produce `400 Bad Request`.

### `GET /api/Destinations/countries/{countryCode}/cities?query={query}`

- **Purpose:** Searches cities within a country by name prefix.
- **Route parameter:** `countryCode`, exactly two letters.
- **Query parameter:** `query`, at least two non-whitespace characters.
- **Response:** `200 OK` with matching `CityResponse` objects.
- **Validation:** Invalid country codes or search queries produce `400 Bad Request`.

## 5. Trip Endpoints

All trip endpoints require a Firebase Bearer token and resolve the local user through `CurrentUserService`.

### `GET /api/Trips`

- **Purpose:** Lists trips owned by the current local user.
- **Response:** `200 OK` with a collection of `Trip` records.
- **Important statuses:** `200`, `401`.
- **Ownership:** The database query filters by `trips.user_id = AppUser.Id`.

### `GET /api/Trips/{id}`

- **Purpose:** Returns one trip.
- **Route parameter:** `id`, a trip UUID.
- **Response:** `200 OK` with a `Trip` record.
- **Important statuses:** `200`, `401`, `404`.
- **Ownership:** Lookup uses both the trip UUID and local user UUID; a missing or non-owned trip is returned as not found.

### `POST /api/Trips`

- **Purpose:** Creates a trip owned by the current local user.
- **Request:** `CreateTripRequest`, containing title, destination country code/name and city, travel dates, optional budget, budget currency, and optional notes.
- **Response:** `201 Created` with the created `Trip` and a location for `/api/trips/{id}`.
- **Important statuses:** `201`, `400`, `401`.
- **Ownership:** The backend supplies `AppUser.Id` during insertion; the request does not contain an ownership user ID.

### `PUT /api/Trips/{id}`

- **Purpose:** Updates a trip and reconciles itinerary scheduling when the date range changes.
- **Request:** `UpdateTripRequest`, using the same primary trip fields as creation.
- **Response:** `200 OK` with the updated `Trip`.
- **Important statuses:** `200`, `400`, `401`, `404`.
- **Ownership:** The update is scoped by trip ID and local user ID.

### `DELETE /api/Trips/{id}`

- **Purpose:** Deletes an owned trip. Database cascades remove its expense and itinerary records.
- **Response:** `204 No Content`.
- **Important statuses:** `204`, `401`, `404`.
- **Ownership:** The delete includes the current local user ID; a missing or non-owned trip is treated as not found.

### `POST /api/Trips/{id}/notes/organize`

- **Purpose:** Uses the backend Gemini integration to organize the supplied trip-note draft after confirming trip ownership.
- **Request:** `OrganizeTripNotesRequest` with a `notes` value between 1 and 10,000 characters after controller validation.
- **Response:** `200 OK` with `OrganizeTripNotesResponse`, containing `organizedNotes`. The endpoint does not save the returned text to the trip.
- **Important statuses:** `200`, `400`, `401`, `404`, `503`.
- **Ownership:** The trip is loaded by both trip ID and local user ID before AI processing. AI service failures are mapped to `503 Service Unavailable`.

## 6. Itinerary Endpoints

All itinerary routes are nested beneath an owned trip:

```text
/api/Trips/{tripId}/itinerary
```

### `GET /api/Trips/{tripId}/itinerary`

- **Purpose:** Lists all itinerary items for an owned trip.
- **Response:** `200 OK` with `TripItineraryItemResponse` objects.
- **Important statuses:** `200`, `401`, `404`.

### `POST /api/Trips/{tripId}/itinerary`

- **Purpose:** Creates an itinerary activity. A positive cost also creates and links an expense in the same transaction.
- **Request:** `CreateTripItineraryItemRequest`, containing activity content, optional scheduling fields, optional URL, optional cost, and currency when required.
- **Response:** `201 Created` with `TripItineraryItemResponse`.
- **Important statuses:** `201`, `400`, `401`, `404`.

### `PUT /api/Trips/{tripId}/itinerary/{itemId}`

- **Purpose:** Fully updates an itinerary activity and synchronizes a linked expense when applicable.
- **Request:** `UpdateTripItineraryItemRequest`.
- **Response:** `200 OK` with `TripItineraryItemResponse`.
- **Important statuses:** `200`, `400`, `401`, `404`.

### `PATCH /api/Trips/{tripId}/itinerary/{itemId}/schedule`

- **Purpose:** Updates only the activity's date, start time, and end time. It does not change content, cost, currency, or linked-expense data.
- **Request:** `UpdateTripItineraryScheduleRequest`. All schedule fields must either be present together or all be null for an unscheduled item.
- **Response:** `200 OK` with `TripItineraryItemResponse`.
- **Important statuses:** `200`, `400`, `401`, `404`.

### `DELETE /api/Trips/{tripId}/itinerary/{itemId}`

- **Purpose:** Deletes an itinerary activity. A linked paid activity is deleted together with its expense in a transaction.
- **Response:** `204 No Content`.
- **Important statuses:** `204`, `401`, `404`.

Every itinerary action validates ownership through the parent trip or an ownership-aware query. Scheduled dates are additionally checked against the trip's current date range. Paid-item operations pass through the itinerary/expense orchestration service.

## 7. Expense Endpoints

All expense routes are nested beneath an owned trip:

```text
/api/Trips/{tripId}/expenses
```

### `GET /api/Trips/{tripId}/expenses`

- **Purpose:** Lists expenses for an owned trip.
- **Response:** `200 OK` with `TripExpenseResponse` objects, including linked itinerary information when present.
- **Important statuses:** `200`, `401`, `404`.

### `POST /api/Trips/{tripId}/expenses`

- **Purpose:** Creates a standalone expense or atomically creates an expense with a linked itinerary activity.
- **Request:** `CreateTripExpenseWithItineraryRequest`, containing expense fields and an optional itinerary schedule object.
- **Response:** `201 Created` with `TripExpenseResponse`.
- **Important statuses:** `201`, `400`, `401`, `404`.

### `PUT /api/Trips/{tripId}/expenses/{expenseId}`

- **Purpose:** Updates an expense while preserving any existing relationship managed by the business service.
- **Request:** `UpdateTripExpenseRequest` with category, title, positive amount, currency, optional reference URL, and optional notes.
- **Response:** `200 OK` with `TripExpenseResponse`.
- **Important statuses:** `200`, `400`, `401`, `404`.

### `POST /api/Trips/{tripId}/expenses/{expenseId}/transition`

- **Purpose:** Replaces an expense while changing or preserving its relationship with an itinerary activity. It supports transitions between standalone expenses and linked itinerary activities.
- **Request:** `TransitionTripExpenseRequest`, containing expense fields and an optional itinerary schedule object.
- **Response:** `200 OK` with `TransitionTripExpenseResponse`, identifying the replaced expense and the resulting expense/itinerary state.
- **Important statuses:** `200`, `400`, `401`, `404`, `409`, `500`.
- **Conflict behavior:** `409 Conflict` indicates the requested relationship is already current and the normal update endpoint should be used.

### `DELETE /api/Trips/{tripId}/expenses/{expenseId}?deleteLinkedActivity={value}`

- **Purpose:** Deletes an expense and optionally its linked itinerary activity.
- **Query parameter:** `deleteLinkedActivity`, an optional Boolean. For linked expenses, omission requests a decision rather than silently choosing how to handle the activity.
- **Response:** `204 No Content` after deletion.
- **Important statuses:** `204`, `401`, `404`, `409`, `500`.
- **Conflict behavior:** `409 Conflict` requests an explicit keep/delete decision when the expense has a linked activity and the query parameter was omitted.

Expense ownership is enforced through the parent trip and ownership-aware service/DAL operations.

## 8. Home Endpoint

### `GET /api/Home/daily-travel-tip`

- **Authentication:** Public.
- **Purpose:** Returns the shared travel tip for the current UTC date.
- **Response:** `200 OK` with `DailyTravelTipResponse`, containing a title and tip, or `204 No Content` when no tip or fallback is available.
- **Behavior:** The backend checks process memory and PostgreSQL before generating data with Gemini. Generated tips are persisted, and stored data can be reused as a cache or fallback across backend restarts.

AI generation and persistence are fully backend-managed; the client does not call Gemini directly.

## 9. Status Code Conventions

The API currently uses several response shapes rather than one universal error contract. It does not expose a universal RFC `ProblemDetails` response.

| Status | Current use |
|---|---|
| `200 OK` | Successful reads, updates, login synchronization, note organization, and expense transitions. |
| `201 Created` | Successful trip, itinerary-item, and expense creation. |
| `204 No Content` | Successful deletes and a daily-tip request with no available result. |
| `400 Bad Request` | Automatic DTO/model validation and explicit validation such as invalid destination input, notes, scheduling, or trip date bounds. |
| `401 Unauthorized` | A protected action cannot resolve a local user from the supplied Firebase Bearer credentials because they are missing, malformed, invalid, or not mapped locally. |
| `404 Not Found` | Requested trip or child resource does not exist within the current user's ownership scope. |
| `409 Conflict` | Expense relationship transition is already current or deletion of a linked expense requires an explicit decision. |
| `503 Service Unavailable` | Gemini-backed trip-note organization fails. |
| `500 Internal Server Error` | Unexpected exceptions handled by global middleware, plus defensive fallback branches in expense transition/delete actions. |

## 10. Ownership and Resource Isolation

The frontend never establishes ownership by submitting a user ID. Firebase Admin verifies the ID token, and its UID resolves to the local `users.id` UUID. Trip access is scoped by that local UUID.

Itinerary items and expenses do not carry a separate user ID. They inherit ownership through their required `trip_id`, and their queries or business operations validate that the parent trip belongs to the current local user. A resource UUID by itself is insufficient to access or mutate data. Missing and non-owned resources are generally returned as `404 Not Found` without distinguishing between those cases.

## 11. Validation

Controllers use `[ApiController]`, so invalid DataAnnotations and `IValidatableObject` results are handled automatically as `400 Bad Request` before the action executes.

Current validation includes:

- Required fields and bounded text lengths for trip, itinerary, and expense contracts.
- Trip end date not preceding its start date.
- Non-negative trip budgets and itinerary costs, and positive expense amounts.
- Three-letter currency values where required.
- Paired itinerary start/end times, an end later than the start, and a required date when times are present.
- Schedule-only updates that are either fully scheduled or fully unscheduled.
- Itinerary dates constrained by controllers to the parent trip date range.
- Optional reference URLs limited in length and validated as absolute HTTP or HTTPS URLs.
- Explicit destination country-code and city-query validation.

Database constraints provide a second integrity boundary for the persisted date, amount, currency, time-pair, text-length, and relationship rules represented in the schema.

## 12. Error Handling

Expected controller cases return explicit HTTP statuses such as 400, 401, 404, 409, and 503, using a mixture of strings, small JSON objects, and automatic model-validation responses.

Unhandled exceptions pass through `GlobalExceptionMiddleware`. The middleware logs the exception and returns a generic JSON response with HTTP 500, a numeric `status`, and a non-sensitive message.

The frontend `apiClient` checks the HTTP status and currently throws an error primarily containing that status. It does not generally preserve the backend response body or its detailed validation/error message in the thrown error.

## 13. API Endpoint Summary

| Area | Method | Route | Authentication | Purpose |
|---|---|---|---|---|
| Auth | `POST` | `/api/Auth/login` | Public bootstrap | Verify Firebase token and synchronize local user. |
| Destinations | `GET` | `/api/Destinations/countries` | Public | List countries. |
| Destinations | `GET` | `/api/Destinations/countries/{countryCode}/cities/major` | Public | List major cities for a country. |
| Destinations | `GET` | `/api/Destinations/countries/{countryCode}/cities?query={query}` | Public | Search cities by prefix. |
| Trips | `GET` | `/api/Trips` | Authenticated | List the current user's trips. |
| Trips | `GET` | `/api/Trips/{id}` | Authenticated | Get one owned trip. |
| Trips | `POST` | `/api/Trips` | Authenticated | Create an owned trip. |
| Trips | `PUT` | `/api/Trips/{id}` | Authenticated | Update an owned trip. |
| Trips | `POST` | `/api/Trips/{id}/notes/organize` | Authenticated | Organize an owned trip's note draft with Gemini. |
| Trips | `DELETE` | `/api/Trips/{id}` | Authenticated | Delete an owned trip. |
| Itinerary | `GET` | `/api/Trips/{tripId}/itinerary` | Authenticated | List itinerary items. |
| Itinerary | `POST` | `/api/Trips/{tripId}/itinerary` | Authenticated | Create an itinerary item. |
| Itinerary | `PUT` | `/api/Trips/{tripId}/itinerary/{itemId}` | Authenticated | Fully update an itinerary item. |
| Itinerary | `PATCH` | `/api/Trips/{tripId}/itinerary/{itemId}/schedule` | Authenticated | Update schedule fields only. |
| Itinerary | `DELETE` | `/api/Trips/{tripId}/itinerary/{itemId}` | Authenticated | Delete an itinerary item. |
| Expenses | `GET` | `/api/Trips/{tripId}/expenses` | Authenticated | List trip expenses. |
| Expenses | `POST` | `/api/Trips/{tripId}/expenses` | Authenticated | Create an expense, optionally linked to an activity. |
| Expenses | `PUT` | `/api/Trips/{tripId}/expenses/{expenseId}` | Authenticated | Update an expense. |
| Expenses | `POST` | `/api/Trips/{tripId}/expenses/{expenseId}/transition` | Authenticated | Transition expense/activity relationship. |
| Expenses | `DELETE` | `/api/Trips/{tripId}/expenses/{expenseId}` | Authenticated | Delete an expense with linked-activity handling. |
| Home | `GET` | `/api/Home/daily-travel-tip` | Public | Return the cached, persisted, or generated daily tip. |
