-- 1.User
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user'
        CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT
);

-- 3. Project Members

CREATE TABLE project_members (
    project_id UUID NOT NULL
        REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL   
        REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (project_id, user_id)
);

-- 4. Tasks

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL
        REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    assigned_to UUID,
    position INTEGER NOT NULL CHECK (position >= 0),
    created_by UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOw(),

    -- each project must have unique task positions
    CONSTRAINT tasks_project_position_unique
        UNIQUE (project_id, position)
        DEFERRABLE INITIALLY DEFERRED,

        -- An assignee must belong to this tasks project
        -- if the membership is deleted, clear the assignment
    CONSTRAINT tasks_project_assignee_membership_fk
        FOREIGN KEY (project_id, assigned_to)
        REFERENCES project_members (project_id, user_id)
        ON DELETE SET NULL (assigned_to) 
);

-- help retrive tasks in their persisted order.
-- the unique constraint above already creates an index On 
-- (project_is, position), so another identical index is unnecessary

