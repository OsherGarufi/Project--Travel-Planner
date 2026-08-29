-- Travel Planner Database Schema
-- PostgreSQL / Supabase

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Users table
-- =========================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    display_name TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- Trips table
-- =========================
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title VARCHAR(100) NOT NULL,
    destination_country_code CHAR(2) NOT NULL,
    destination_country_name VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    budget_amount NUMERIC(12, 2),
    budget_currency CHAR(3) NOT NULL DEFAULT 'ILS',

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT trips_dates_check
        CHECK (end_date >= start_date),

    CONSTRAINT trips_budget_check
        CHECK (
            budget_amount IS NULL
            OR budget_amount >= 0
        )
);

-- =========================
-- Trip expenses table
-- =========================
CREATE TABLE IF NOT EXISTS trip_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trip_id UUID NOT NULL
        REFERENCES trips(id)
        ON DELETE CASCADE,

    category VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,

    amount NUMERIC(12, 2) NOT NULL,
    currency CHAR(3) NOT NULL,

    reference_url TEXT,
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT trip_expenses_category_check
        CHECK (
            char_length(trim(category)) > 0
        ),

    CONSTRAINT trip_expenses_title_check
        CHECK (
            char_length(trim(title)) > 0
        ),

    CONSTRAINT trip_expenses_amount_check
        CHECK (
            amount > 0
        ),

    CONSTRAINT trip_expenses_currency_check
        CHECK (
            currency ~ '^[A-Z]{3}$'
        ),

    CONSTRAINT trip_expenses_reference_url_check
        CHECK (
            reference_url IS NULL
            OR char_length(reference_url) <= 2048
        ),

    CONSTRAINT trip_expenses_notes_check
        CHECK (
            notes IS NULL
            OR char_length(notes) <= 2000
        )
);

-- =========================
-- Trip itinerary items table
-- =========================
CREATE TABLE IF NOT EXISTS trip_itinerary_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trip_id UUID NOT NULL,

    expense_id UUID NULL,

    title VARCHAR(100) NOT NULL,

    description VARCHAR(2000) NULL,

    category VARCHAR(50) NOT NULL,

    itinerary_date DATE NULL,

    start_time TIME NULL,

    end_time TIME NULL,

    reference_url VARCHAR(2048) NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_trip_itinerary_items_trip
        FOREIGN KEY (trip_id)
        REFERENCES trips(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_trip_itinerary_items_expense
        FOREIGN KEY (expense_id)
        REFERENCES trip_expenses(id)
        ON DELETE SET NULL,

    CONSTRAINT ck_trip_itinerary_items_title
        CHECK (
            LENGTH(TRIM(title)) > 0
        ),

    CONSTRAINT ck_trip_itinerary_items_category
        CHECK (
            LENGTH(TRIM(category)) > 0
        ),

    CONSTRAINT ck_trip_itinerary_items_time_pair
        CHECK (
            (
                start_time IS NULL
                AND end_time IS NULL
            )
            OR
            (
                start_time IS NOT NULL
                AND end_time IS NOT NULL
            )
        ),

    CONSTRAINT ck_trip_itinerary_items_time_order
        CHECK (
            start_time IS NULL
            OR end_time > start_time
        ),

    CONSTRAINT ck_trip_itinerary_items_schedule_date
        CHECK (
            itinerary_date IS NOT NULL
            OR (
                start_time IS NULL
                AND end_time IS NULL
            )
        )
);

-- =========================
-- Indexes
-- =========================
CREATE INDEX IF NOT EXISTS idx_trips_user_id
    ON trips(user_id);

CREATE INDEX IF NOT EXISTS idx_trips_country_code
    ON trips(destination_country_code);

CREATE INDEX IF NOT EXISTS idx_trips_city
    ON trips(destination_city);

CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip_id
    ON trip_expenses(trip_id);

CREATE INDEX IF NOT EXISTS ix_trip_itinerary_items_trip_id
    ON trip_itinerary_items(trip_id);

CREATE INDEX IF NOT EXISTS ix_trip_itinerary_items_trip_date
    ON trip_itinerary_items(
        trip_id,
        itinerary_date
    );

CREATE INDEX IF NOT EXISTS ix_trip_itinerary_items_trip_date_start_time
    ON trip_itinerary_items(
        trip_id,
        itinerary_date,
        start_time
    );

CREATE UNIQUE INDEX IF NOT EXISTS ux_trip_itinerary_items_expense_id
    ON trip_itinerary_items(expense_id)
    WHERE expense_id IS NOT NULL;

-- =========================
-- Row Level Security
-- =========================
ALTER TABLE users
ENABLE ROW LEVEL SECURITY;

ALTER TABLE trips
ENABLE ROW LEVEL SECURITY;

ALTER TABLE trip_expenses
ENABLE ROW LEVEL SECURITY;

ALTER TABLE trip_itinerary_items
ENABLE ROW LEVEL SECURITY;

-- =========================
-- Auto update updated_at
-- =========================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_trips_updated_at
BEFORE UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_trip_expenses_updated_at
BEFORE UPDATE ON trip_expenses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_trip_itinerary_items_updated_at
BEFORE UPDATE ON trip_itinerary_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();