# Environment Configuration Guide

## Development Server Port Configuration

### Default Port Settings
- **Development Server**: Port 3000 (changed from default 5173)
- **Preview Server**: Port 3000
- **Auto-opens browser** on server start

### Alternative Port Commands
```bash
# Default development (port 3000)
npm run dev

# Alternative ports if 3000 is busy
npm run dev:3001    # Port 3001
npm run dev:4000    # Port 4000  
npm run dev:8080    # Port 8080

# Custom port (any available port)
npx vite --port 5555
```

### Port Conflict Resolution
If you encounter port conflicts:
1. Check what's using the port: `netstat -ano | findstr :3000` (Windows)
2. Kill the process or use alternative port
3. Vite will automatically try the next available port if configured port is busy

## Logging Configuration

### Project Logger Levels
Set `VITE_LOG_LEVEL` environment variable to control console output:

- `0` = Silent (production)
- `1` = Errors only
- `2` = Warnings + Errors (default)
- `3` = Info + Warnings + Errors  
- `4` = All logs (full debug)

### Example .env.local
```bash
# Reduce logging noise during development
VITE_LOG_LEVEL=2

# Your other environment variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## Third-Party Logging Issues

### Sentry Debug Logging (Development Environment)
If you're seeing excessive Sentry debug logs like:
```
Sentry Logger [log]: [Measurement] Setting measurement on root span...
Sentry Logger [log]: [Tracing] Adding an event to span...
```

This is coming from your development environment (StackBlitz/WebContainer), not your project code.

**Solutions:**

1. **Browser Console Filtering**
   - Open Developer Tools
   - Go to Console tab
   - Add filter: `-sentry -Sentry` to hide Sentry logs
   - Or set console level to "Warnings" or "Errors" only

2. **Environment Variable** (if available in your dev environment)
   ```bash
   SENTRY_DEBUG=false
   ```

3. **Browser Extension** (for persistent filtering)
   - Install "Console Ninja" or similar extension
   - Configure global filters for "Sentry Logger"

### StackBlitz/WebContainer Specific
If using StackBlitz or similar online IDE:
- The Sentry logging is part of their performance monitoring
- Cannot be disabled from your project code
- Best solution is browser console filtering

## Recommended Development Setup

```bash
# .env.local for clean development experience
VITE_LOG_LEVEL=2                    # Warnings + Errors only
NODE_ENV=development
```

This configuration will:
- Show only warnings and errors from your project
- Hide debug/info noise from AuthContext
- Keep essential error logging for debugging
