-- CREATE TABLE "users" (
--     "id" bigserial PRIMARY KEY,
--     "username" varchar(255) NOT NULL UNIQUE,
--     "email" varchar(255) NOT NULL UNIQUE,
--     "password" varchar(255) NOT NULL
-- );



CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);