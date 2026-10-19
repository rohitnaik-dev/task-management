BEGIN;

-- 1.add password hash
-- initiall nullable so existing users do not break the migration.

ALTER TABLE users
ADD COLUMN password_hash TEXT;

-- 2. normalize existing email addressess.
UPDATE users
SET email = LOWER(TRIM(email));

-- 3.enforce normalized emails for future inserts and update
-- prevent duplicates

CREATE UNIQUE INDEX users_email_normalized_unique
ON users (LOWER(TRIM(email)));

-- 4.normalize emails automatically before storing them.
CREATE OR REPLACE FUNCTION normalize_user_email()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email := LOWER(TRIM(NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_normalize_email_trigger
BEFORE INSERT OR UPDATE OF email ON users 
FOR EACH ROW
EXECUTE FUNCTION normalize_user_email();

COMMIT;

