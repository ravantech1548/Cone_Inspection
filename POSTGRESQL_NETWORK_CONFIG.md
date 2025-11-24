# PostgreSQL Network Configuration for Intranet Access

## Overview
To allow the application to connect to PostgreSQL using the IP address (100.86.98.82) instead of localhost, PostgreSQL needs to be configured to listen on the network interface.

---

## Current Configuration
- **Database URL**: `postgresql://textile_user:textile_pass_123@100.86.98.82:5432/textile_inspector`
- **Machine IP**: 100.86.98.82

---

## PostgreSQL Configuration Steps

### Step 1: Find PostgreSQL Configuration Files

PostgreSQL configuration files are typically located at:
```
C:\Program Files\PostgreSQL\<version>\data\
```

Key files:
- `postgresql.conf` - Main configuration
- `pg_hba.conf` - Client authentication

### Step 2: Edit postgresql.conf

Open `postgresql.conf` with administrator privileges and find the line:
```conf
#listen_addresses = 'localhost'
```

Change it to:
```conf
listen_addresses = '*'
# Or specifically: listen_addresses = 'localhost,100.86.98.82'
```

This allows PostgreSQL to accept connections from all network interfaces.

### Step 3: Edit pg_hba.conf

Add the following line to allow connections from your local network:

```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    textile_inspector  textile_user    100.86.98.0/24         md5
host    textile_inspector  textile_user    127.0.0.1/32           md5
host    all             all             127.0.0.1/32           md5
```

This allows:
- Connections from the local subnet (100.86.98.0/24)
- Connections from localhost (127.0.0.1)

### Step 4: Restart PostgreSQL Service

```powershell
# Restart PostgreSQL service
Restart-Service postgresql-x64-<version>

# Or use Services GUI:
# 1. Press Win+R, type "services.msc"
# 2. Find "postgresql-x64-<version>"
# 3. Right-click → Restart
```

### Step 5: Configure Windows Firewall

Allow PostgreSQL port (5432) through Windows Firewall:

```powershell
# Allow PostgreSQL through firewall
New-NetFirewallRule -DisplayName "PostgreSQL Database" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow
```

### Step 6: Test Connection

Test the connection from localhost using the IP address:

```powershell
# Test connection using IP address
psql -h 100.86.98.82 -U textile_user -d textile_inspector

# If successful, you'll see:
# Password for user textile_user:
# textile_inspector=>
```

---

## Alternative: Keep PostgreSQL on Localhost

If you prefer to keep PostgreSQL accessible only from localhost (more secure), you can:

### Option 1: Use localhost in DATABASE_URL

Update `.env`:
```env
DATABASE_URL=postgresql://textile_user:textile_pass_123@localhost:5432/textile_inspector
```

This works because the backend application runs on the same machine as PostgreSQL.

### Option 2: Use 127.0.0.1

```env
DATABASE_URL=postgresql://textile_user:textile_pass_123@127.0.0.1:5432/textile_inspector
```

---

## Recommended Configuration

**For Development/Intranet Use:**
- Keep PostgreSQL on localhost (127.0.0.1)
- Only expose web services (ports 3001, 5000, 5173)
- Database remains secure and not exposed to network

**Updated .env:**
```env
# Database - Keep on localhost for security
DATABASE_URL=postgresql://textile_user:textile_pass_123@127.0.0.1:5432/textile_inspector

# Web services - Use IP for intranet access
FRONTEND_URL=https://100.86.98.82:5173
INFERENCE_SERVICE_URL=https://100.86.98.82:5000
```

This is the **recommended approach** because:
- ✅ Database is not exposed to network
- ✅ Only web services are accessible from intranet
- ✅ More secure configuration
- ✅ Simpler setup (no PostgreSQL network config needed)

---

## Security Considerations

### If Exposing PostgreSQL to Network:
1. **Use strong passwords**
2. **Limit IP ranges** in pg_hba.conf
3. **Use SSL/TLS** for database connections
4. **Regular backups**
5. **Monitor access logs**

### Best Practice:
- Keep database on localhost
- Only expose application services
- Use reverse proxy for production

---

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 100.86.98.82:5432
```

**Solutions:**
1. Check if PostgreSQL is running: `Get-Service postgresql*`
2. Verify listen_addresses in postgresql.conf
3. Check pg_hba.conf has correct entries
4. Restart PostgreSQL service
5. Check firewall rules

### Authentication Failed
```
Error: password authentication failed for user "textile_user"
```

**Solutions:**
1. Verify password in .env matches database
2. Check pg_hba.conf authentication method (should be 'md5' or 'scram-sha-256')
3. Ensure user has correct permissions

### Cannot Find Configuration Files
```powershell
# Find PostgreSQL data directory
Get-Service postgresql* | Select-Object Name, DisplayName

# Common locations:
# C:\Program Files\PostgreSQL\14\data\
# C:\Program Files\PostgreSQL\15\data\
# C:\Program Files\PostgreSQL\16\data\
```

---

## Quick Commands

```powershell
# Check PostgreSQL service status
Get-Service postgresql*

# Restart PostgreSQL
Restart-Service postgresql-x64-14  # Adjust version number

# Test connection
psql -h 100.86.98.82 -U textile_user -d textile_inspector

# Check listening ports
netstat -an | findstr :5432

# View PostgreSQL logs
Get-Content "C:\Program Files\PostgreSQL\14\data\log\*.log" -Tail 50
```

---

## Summary

**Recommended Setup:**
- ✅ Database: localhost/127.0.0.1 (secure, no network exposure)
- ✅ Backend: 100.86.98.82:3001 (accessible from intranet)
- ✅ Frontend: 100.86.98.82:5173 (accessible from intranet)
- ✅ Inference: 100.86.98.82:5000 (accessible from intranet)

This provides the best balance of accessibility and security for your intranet deployment.
