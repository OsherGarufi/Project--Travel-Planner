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

    CONSTRAINT trips_dates_check CHECK (end_date >= start_date),
    CONSTRAINT trips_budget_check CHECK (budget_amount IS NULL OR budget_amount >= 0)
);

-- =========================
-- Indexes
-- =========================
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_country_code ON trips(destination_country_code);
CREATE INDEX IF NOT EXISTS idx_trips_city ON trips(destination_city);

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
