UPDATE "User"
SET 
  "password" = '$2b$12$ffTHD71D0BZDKJzMtxw7AuuTpQ9esju6S6wLPJBq6AO2.edrldxrS',
  "failedLoginAttempts" = 0,
  "lockUntil" = NULL,
  "isActive" = true,
  "deletedAt" = NULL
WHERE email = 'admin@travelos.com';
