CREATE TABLE users(
    id PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,,
    password_hashed TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE active_tokens(
    token TEXT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
