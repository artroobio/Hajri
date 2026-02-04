-- Create projects table if not exists (or update if exists)
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT, -- Basic project name
  client_name TEXT,
  site_address TEXT,
  architect_name TEXT,
  engineer_name TEXT,
  construction_types TEXT[], -- Array of strings for checkboxes
  project_team JSONB, -- Array of {name, role} objects
  gst_number TEXT,
  phone TEXT,
  project_start_date DATE
);

-- Add columns if they don't exist (idempotent approach)
DO $$ 
BEGIN 
    -- client_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='client_name') THEN 
        ALTER TABLE projects ADD COLUMN client_name TEXT; 
    END IF;

    -- gst_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='gst_number') THEN 
        ALTER TABLE projects ADD COLUMN gst_number TEXT; 
    END IF;

    -- phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='phone') THEN 
        ALTER TABLE projects ADD COLUMN phone TEXT; 
    END IF;

    -- project_start_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='project_start_date') THEN 
        ALTER TABLE projects ADD COLUMN project_start_date DATE; 
    END IF;

    -- site_address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='site_address') THEN 
        ALTER TABLE projects ADD COLUMN site_address TEXT; 
    END IF;

    -- architect_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='architect_name') THEN 
        ALTER TABLE projects ADD COLUMN architect_name TEXT; 
    END IF;

    -- engineer_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='engineer_name') THEN 
        ALTER TABLE projects ADD COLUMN engineer_name TEXT; 
    END IF;

    -- construction_types
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='construction_types') THEN 
        ALTER TABLE projects ADD COLUMN construction_types TEXT[]; 
    END IF;

    -- project_team
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='project_team') THEN 
        ALTER TABLE projects ADD COLUMN project_team JSONB; 
    END IF;
END $$;

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access (simplified for this app as requested previously)
DROP POLICY IF EXISTS "Allow all access to projects" ON projects;
CREATE POLICY "Allow all access to projects" ON projects FOR ALL USING (true) WITH CHECK (true);
