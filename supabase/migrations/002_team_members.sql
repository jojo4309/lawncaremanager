-- Team members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'active'
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(owner_profile_id, email)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Owner can manage their team
CREATE POLICY "Owners manage their team"
  ON team_members FOR ALL
  USING (auth.uid() = owner_profile_id);

-- Members can see their own membership
CREATE POLICY "Members see own membership"
  ON team_members FOR SELECT
  USING (auth.uid() = member_user_id);

-- ──────────────────────────────────────────────────────────
-- Helper: returns the "working" profile_id for the caller.
-- If the caller is a team member, returns the owner's ID.
-- Otherwise returns the caller's own UID.
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION working_profile_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  owner_id UUID;
BEGIN
  SELECT owner_profile_id INTO owner_id
  FROM team_members
  WHERE member_user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
  RETURN COALESCE(owner_id, auth.uid());
END;
$$;

-- ──────────────────────────────────────────────────────────
-- Update every existing RLS policy to allow team members
-- to access the owner's rows.
-- ──────────────────────────────────────────────────────────

-- profiles
DROP POLICY IF EXISTS "Users manage own profile" ON profiles;
CREATE POLICY "Profile access"
  ON profiles FOR ALL
  USING (id = working_profile_id());

-- customers
DROP POLICY IF EXISTS "Users manage own customers" ON customers;
CREATE POLICY "Customer access"
  ON customers FOR ALL
  USING (profile_id = working_profile_id());

-- properties
DROP POLICY IF EXISTS "Users manage own properties" ON properties;
CREATE POLICY "Property access"
  ON properties FOR ALL
  USING (profile_id = working_profile_id());

-- jobs
DROP POLICY IF EXISTS "Users manage own jobs" ON jobs;
CREATE POLICY "Job access"
  ON jobs FOR ALL
  USING (profile_id = working_profile_id());

-- recurring_schedules
DROP POLICY IF EXISTS "Users manage own recurring" ON recurring_schedules;
CREATE POLICY "Recurring access"
  ON recurring_schedules FOR ALL
  USING (profile_id = working_profile_id());

-- invoices
DROP POLICY IF EXISTS "Users manage own invoices" ON invoices;
CREATE POLICY "Invoice access"
  ON invoices FOR ALL
  USING (profile_id = working_profile_id());

-- invoice_line_items
DROP POLICY IF EXISTS "Users manage own line items" ON invoice_line_items;
CREATE POLICY "Line item access"
  ON invoice_line_items FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE profile_id = working_profile_id()
    )
  );

-- payments
DROP POLICY IF EXISTS "Users manage own payments" ON payments;
CREATE POLICY "Payment access"
  ON payments FOR ALL
  USING (profile_id = working_profile_id());

-- estimates
DROP POLICY IF EXISTS "Users manage own estimates" ON estimates;
CREATE POLICY "Estimate access"
  ON estimates FOR ALL
  USING (profile_id = working_profile_id());

-- estimate_line_items
DROP POLICY IF EXISTS "Users manage own estimate items" ON estimate_line_items;
CREATE POLICY "Estimate item access"
  ON estimate_line_items FOR ALL
  USING (
    estimate_id IN (
      SELECT id FROM estimates WHERE profile_id = working_profile_id()
    )
  );

-- expenses
DROP POLICY IF EXISTS "Users manage own expenses" ON expenses;
CREATE POLICY "Expense access"
  ON expenses FOR ALL
  USING (profile_id = working_profile_id());

-- equipment
DROP POLICY IF EXISTS "Users manage own equipment" ON equipment;
CREATE POLICY "Equipment access"
  ON equipment FOR ALL
  USING (profile_id = working_profile_id());

-- maintenance_records
DROP POLICY IF EXISTS "Users manage own maintenance" ON maintenance_records;
CREATE POLICY "Maintenance access"
  ON maintenance_records FOR ALL
  USING (profile_id = working_profile_id());
