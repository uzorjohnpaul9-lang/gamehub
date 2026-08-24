CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'password',
    oauth_sub TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'password';
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_sub TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

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

CREATE TABLE IF NOT EXISTS mods (
    id SERIAL PRIMARY KEY,
    game_title TEXT NOT NULL,
    name TEXT NOT NULL,
    author TEXT,
    version TEXT,
    url TEXT,
    description TEXT,
    ram_add_gb INTEGER NOT NULL DEFAULT 0 CHECK (ram_add_gb >= 0 AND ram_add_gb <= 64),
    cpu_multiplier REAL NOT NULL DEFAULT 1.0 CHECK (cpu_multiplier >= 1.0 AND cpu_multiplier <= 4.0),
    gpu_multiplier REAL NOT NULL DEFAULT 1.0 CHECK (gpu_multiplier >= 1.0 AND gpu_multiplier <= 4.0),
    fps_multiplier REAL NOT NULL DEFAULT 1.0 CHECK (fps_multiplier > 0.05 AND fps_multiplier <= 1.0),
    sha256_checksum TEXT,
    file_size_mb REAL,
    vt_status TEXT NOT NULL DEFAULT 'pending' CHECK (vt_status IN ('pending','clean','flagged')),
    vt_report_url TEXT,
    last_scanned_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('draft','live')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (game_title, name)
);
