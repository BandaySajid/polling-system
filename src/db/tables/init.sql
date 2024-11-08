CREATE TABLE IF NOT EXISTS polls (
    id SERIAL PRIMARY KEY,
    question VARCHAR(300),
    options TEXT[],
    votes_count INT[],
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    poll_id INT NOT NULL,
    option INT NOT NULL,  
		FOREIGN KEY (poll_id) REFERENCES polls(id)
);

