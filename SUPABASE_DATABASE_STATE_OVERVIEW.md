# 📋 COMPREHENSIVE SUPABASE DATABASE STATE OVERVIEW
*Last Updated: July 3, 2025*

## 🗂️ **CURRENT DATABASE SCHEMA**

### **Tables:**

#### 1. **profiles** (Primary user data table)
```sql
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    first_name text,
    last_name text,
    phone text,
    address text,
    ira_accounts text,
    investment_goals text,
    net_worth text,
    annual_income text,
    verification_status text DEFAULT 'pending', -- Added in 20250702000000
    verification_requested boolean DEFAULT false, -- Added in 20250702000000
    role text DEFAULT 'user', -- Added in comprehensive restoration
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

#### 2. **contact_submissions** (Contact form data)
```sql
CREATE TABLE contact_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text,
    message text,
    consultation_type text, -- 'email', 'video', 'phone'
    preferred_date date,
    preferred_time time,
    created_at timestamptz DEFAULT now()
);
```

#### 3. **Investment Workflow Tables** (From comprehensive restoration - may exist):
- **simple_applications** - Investment applications
- **simple_notifications** - User notifications  
- **user_activity** - Activity tracking
- **document_signatures** - Document signing tracking

---

## 🔧 **CURRENT FUNCTIONS:**

### **Core Functions:**

#### 1. **safe_upsert_user_profile()** (From master clean migration)
```sql
FUNCTION safe_upsert_user_profile(
    p_user_id uuid,
    p_first_name text DEFAULT NULL,
    p_last_name text DEFAULT NULL,
    p_phone text DEFAULT NULL,
    p_address text DEFAULT NULL,
    p_ira_accounts text DEFAULT NULL,
    p_investment_goals text DEFAULT NULL,
    p_net_worth text DEFAULT NULL,
    p_annual_income text DEFAULT NULL
) RETURNS boolean
```
- **Purpose:** Safe profile updates for authenticated users
- **Security:** SECURITY DEFINER, checks auth.uid()

#### 2. **sync_auth_users_to_profiles()** (From user sync migration)
```sql
FUNCTION sync_auth_users_to_profiles()
RETURNS TABLE (synced_count integer, message text)
```
- **Purpose:** Syncs users from auth.users to profiles table
- **Security:** SECURITY DEFINER
- **Usage:** Admin function for user management

#### 3. **handle_new_user()** (Trigger function)
```sql
FUNCTION handle_new_user() RETURNS trigger
```
- **Purpose:** Auto-creates profile when new user signs up
- **Trigger:** ON auth.users AFTER INSERT

---

## 🔐 **ROW LEVEL SECURITY (RLS) POLICIES:**

### **profiles table:**
1. **"profiles_user_access"** - Users can access their own profile
2. **"Users can view own verification status"** - Self verification viewing
3. **"Users can request verification"** - Self verification requests  
4. **"Admins can manage all verifications"** - Admin access for `innercirclelending@gmail.com`

### **contact_submissions table:**
1. **"contact_submissions_user_access"** - Public read access

---

## 📊 **INDEXES:**
- **idx_profiles_verification_status** - On verification_status column
- **idx_profiles_verification_requested** - On verification_requested WHERE true

---

## 🚨 **KNOWN ISSUES & FIXES:**

### **Issue 1: Unicode RAISE Statements**
- **Problem:** Migration `20250629150000_comprehensive_restoration.sql` had Unicode ✅ characters
- **Status:** File disabled/replaced with fixed versions
- **Solution:** Use ASCII-only RAISE statements

### **Issue 2: Trigger Field Mismatch** 
- **Problem:** log_user_activity() function expecting user_id but profiles uses id
- **Status:** Triggers removed in emergency fix
- **Solution:** Use auth.email() for admin policies instead of profile queries

### **Issue 3: Infinite Recursion in RLS**
- **Problem:** Admin policy querying profiles table from within profiles policy
- **Status:** Fixed
- **Solution:** Use `auth.email() = 'innercirclelending@gmail.com'` instead of EXISTS query

---

## 🎯 **CURRENT WORKING STATE:**

### **✅ What's Working:**
- User authentication and profile creation
- Profile updates via safe_upsert_user_profile()
- User sync from auth to profiles
- Contact form submissions
- Admin access for innercirclelending@gmail.com
- Verification status tracking

### **❌ What's Potentially Broken:**
- Investment workflow tables (if they exist from comprehensive restoration)
- Activity logging triggers (removed in emergency fix)
- Unicode-containing migrations may cause re-trigger issues

---

## 📝 **MIGRATION HISTORY:**

1. **20250628150000_master_clean_migration.sql** - Reset to minimal setup
2. **20250629150000_placeholder.sql** - Placeholder (disabled original)
3. **20250702000000_add_verification_columns.sql** - Added verification fields
4. **20250702100000_add_user_sync_function.sql** - Added sync function
5. **20250702110000_comprehensive_restoration_fixed.sql** - Complex workflow (problematic)
6. **20250703000000_clean_emergency_fix.sql** - Emergency clean solution

---

## 🔮 **RECOMMENDED NEXT STEPS:**

1. **Delete all migration files** (as you suggested)
2. **Keep this overview as reference** for what currently exists
3. **Create new clean migrations** going forward
4. **Test current working state** before adding new features
5. **Use `auth.email()` pattern** for future admin policies

---

**🎯 BOTTOM LINE:** Your database has a working profiles system with user sync functionality. The core user management works, but investment workflow components may exist in an uncertain state due to migration conflicts.
