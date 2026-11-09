CREATE TABLE IF NOT EXISTS worker_profiles (
    id UUID NOT NULL PRIMARY KEY,
    owner_id UUID NOT NULL UNIQUE,
    headline VARCHAR(120) NOT NULL,
    bio VARCHAR(2000) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_worker_profiles_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_worker_profiles_city ON worker_profiles (city);

CREATE TABLE IF NOT EXISTS worker_profile_skills (
    worker_profile_id UUID NOT NULL,
    skill VARCHAR(60) NOT NULL,
    CONSTRAINT fk_worker_profile_skills_profile FOREIGN KEY (worker_profile_id)
        REFERENCES worker_profiles (id) ON DELETE CASCADE,
    CONSTRAINT pk_worker_profile_skills PRIMARY KEY (worker_profile_id, skill)
);

CREATE TABLE IF NOT EXISTS worker_profile_categories (
    worker_profile_id UUID NOT NULL,
    service_category VARCHAR(60) NOT NULL,
    CONSTRAINT fk_worker_profile_categories_profile FOREIGN KEY (worker_profile_id)
        REFERENCES worker_profiles (id) ON DELETE CASCADE,
    CONSTRAINT pk_worker_profile_categories PRIMARY KEY (worker_profile_id, service_category)
);
