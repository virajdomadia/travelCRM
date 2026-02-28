-- Enable RLS on AuditLog table
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Create policy that forces rows to match the session variable
-- bypass_rls is used for system/SUPER_ADMIN operations
CREATE POLICY tenant_isolation_policy_auditlog ON "AuditLog"
    FOR ALL
    USING (
        "agencyId" = current_setting('app.current_tenant_id', TRUE)::text 
        OR current_setting('app.bypass_rls', TRUE) = 'true'
    );