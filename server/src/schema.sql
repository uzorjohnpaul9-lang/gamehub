CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    steam_app_id BIGINT UNIQUE,
    title TEXT NOT NULL UNIQUE,
    rating REAL NOT NULL DEFAULT 4.0,
    compatibility TEXT NOT NULL DEFAULT 'medium',
    min_ram INTEGER,
    rec_ram INTEGER,
    min_cpu INTEGER,
    min_gpu INTEGER,
    rec_cpu INTEGER,
    rec_gpu INTEGER,
    base_fps INTEGER DEFAULT 50,
    image_url TEXT,
    price TEXT,
    is_free BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'live',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rigs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'My PC',
    cpu TEXT NOT NULL,
    gpu TEXT NOT NULL,
    ram INTEGER NOT NULL CHECK (ram > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, name)
);
