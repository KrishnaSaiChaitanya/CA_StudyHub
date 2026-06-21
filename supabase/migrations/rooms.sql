
CREATE TABLE IF NOT EXISTS subject_meet_links (
    subject_id TEXT PRIMARY KEY,
    meet_url TEXT NOT NULL DEFAULT 'https://meet.google.com/new',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE subject_meet_links ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone with authenticated role to read
CREATE POLICY "Allow authenticated users to read subject_meet_links"
    ON subject_meet_links FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow admins to insert/update/delete
-- Assuming there's a profiles table with a role column or similar
-- For now, let's just use the same logic as other admin tables if possible.
-- Looking at previous conversations, admin role might be checkable via profiles.role
CREATE POLICY "Allow admins full access to subject_meet_links"
    ON subject_meet_links FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Seed the table with default values for all subjects in SubjectCategory
INSERT INTO subject_meet_links (subject_id, meet_url) VALUES
('principles_and_practice_of_accounting', 'https://meet.google.com/new'),
('business_laws', 'https://meet.google.com/new'),
('business_math_logical_reasoning_and_statistics', 'https://meet.google.com/new'),
('business_economics', 'https://meet.google.com/new'),
('advanced_accounting', 'https://meet.google.com/new'),
('corporate_and_other_laws', 'https://meet.google.com/new'),
('taxation', 'https://meet.google.com/new'),
('cost_and_management_accounting', 'https://meet.google.com/new'),
('auditing_and_ethics', 'https://meet.google.com/new'),
('financial_management_and_strategic_management', 'https://meet.google.com/new'),
('financial_reporting', 'https://meet.google.com/new'),
('advanced_financial_management', 'https://meet.google.com/new'),
('advanced_auditing_assurance_and_professional_ethics', 'https://meet.google.com/new'),
('direct_tax_laws', 'https://meet.google.com/new'),
('indirect_tax_laws', 'https://meet.google.com/new'),
('integrated_business_solutions', 'https://meet.google.com/new')
ON CONFLICT (subject_id) DO NOTHING;
