CREATE TABLE IF NOT EXISTS jobs (
    id UUID NOT NULL PRIMARY KEY,
    employer_id UUID NOT NULL,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(4000) NOT NULL,
    category VARCHAR(60) NOT NULL,
    employment_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_jobs_employer FOREIGN KEY (employer_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_jobs_employment_type CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY')),
    CONSTRAINT chk_jobs_status CHECK (status IN ('OPEN', 'CLOSED'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_category_city ON jobs (status, category, city);
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs (employer_id);

CREATE TABLE IF NOT EXISTS job_applications (
    id UUID NOT NULL PRIMARY KEY,
    job_id UUID NOT NULL,
    applicant_id UUID NOT NULL,
    message VARCHAR(1000),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_job_applications_job FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE,
    CONSTRAINT fk_job_applications_applicant FOREIGN KEY (applicant_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_job_applications_job_applicant UNIQUE (job_id, applicant_id),
    CONSTRAINT chk_job_applications_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON job_applications (applicant_id);
