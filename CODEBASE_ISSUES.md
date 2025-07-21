# 🐛 Suspect Functions & Modules

Below is a curated list of functions, components, and scripts whose current implementation appears logically flawed, internally inconsistent, or otherwise risky.  
(Items are grouped by domain and reference the paths used in the latest refactor.)

---

## 1. Database / Backend

| File | Function | Problem |
|------|----------|---------|
| `src/lib/investments.ts` | `getActiveInvestments()` | Falls back to a client-side filter when the `rpc_get_active_investments` function fails. The fallback ignores RLS and can leak data across tenants. |
| `src/lib/investments.ts` | `createInvestment()` | Swallows Supabase errors and returns `{ data: null }` in several branches, causing silent UI failures. |
| `src/lib/documents.ts` | `signDocument()` | Uses optimistic update without rollback for failure cases; possible state divergence. |
| `fix_db_functions.js` / `fix_db_functions.sh` | entire scripts | Assumes psql is available and hardcodes credentials; prone to leaking secrets in CI logs. |
| `20250626172000_emergency_function_fix.sql` | migration | Drops and recreates functions without preserving existing grants; could break prod roles. |

## 2. Service Layer

| File | Function | Issue |
|------|----------|-------|
| `src/lib/notifications.ts` | `subscribeToAdminAlerts()` | Opens a realtime channel but never unsubscribes, leading to memory leaks after route changes. |
| `src/lib/auth.ts` | `refreshSession()` | Assumes `supabase.auth.refreshSession` always returns a session; on 401 it loops indefinitely. |

## 3. React Components

| Component | Issue |
|-----------|-------|
| `ConsultationForm.tsx` | Still calls `supabase.from('consultations')` directly; duplicates logic in `crm-service.ts`. |
| `DocumentSigningStep.tsx` | Mutates Zustand store directly (`store.state = …`) bypassing the setter; breaks immutability guarantees. |
| `NotificationBell.tsx` | Registers two separate websocket listeners for the same event, causing duplicate notifications. |
| `ProtectedRoute.tsx` | Relies on a stale snapshot from `authStore` without subscribing; user logout is not detected. |
| `UserProfileModal/index.tsx` | Catches errors but renders nothing, leaving the modal blank instead of showing an error state. |

## 4. Utilities

| File | Function | Concern |
|------|----------|---------|
| `src/utils/helpers.ts` | `debounce(fn, wait)` | Uses `setTimeout` but never clears the timer on unmount, leaking handles in React components. |
| `src/lib/client.ts` | `createBrowserSupabaseClient()` | Disables `persistSession` when `NODE_ENV !== 'production'`; causes confusing auth behaviour in staging. |

## 5. Performance Hooks

| Hook | Flaw |
|------|------|
| `src/hooks/usePerformance.ts` → `useThrottle()` | Calculates next delay with `Date.now()` instead of `performance.now()`, leading to clock-skew bugs in some browsers. |
| `src/hooks/usePerformance.ts` → `useDebouncedValue()` | Returns previous value on the first call, breaking controlled inputs. |

---

### 🔧 Recommended Next Steps
1. Prioritise database-level issues (`investments`, migration grants).
2. Replace fallback client filters with secure server queries.
3. Ensure every realtime subscription exposes an unsubscribe method and is invoked on unmount.
4. Refactor legacy direct Supabase calls to go through the service layer.
5. Add comprehensive tests around auth session refresh and ProtectedRoute behaviour.

---

## 6. Additional Critical Issues Found

| File | Function/Issue | Problem |
|------|---------------|---------|
| `src/hooks/useDashboardData.ts` | Line 206-208 | References `authService` and `investmentService` without importing them, causing runtime errors. |
| `src/contexts/AuthContext.tsx` | Lines 165, 172 | Calls `setIsInitialized(true)` but `isInitialized` state is never declared with `useState`. |
| `src/contexts/AuthContext.tsx` | Lines 57, 66, 130, 142 | `setTimeout` handles in `Promise.race` are never cleared, causing memory leaks. |
| `src/contexts/AuthContext.tsx` | Lines 199, 207 | Uses `window.location.href = '/'` instead of proper React navigation patterns. |
| `src/pages/DataRoom.tsx` | Lines 31-35 | Direct style injection into `document.head` is an anti-pattern in React. |
| `src/pages/DataRoom.tsx` | Line 67 | Uses `any[]` type instead of proper typing: `const [files, setFiles] = useState<any[]>([])`. |

## 7. Service Layer Type Safety Issues

| File | Function | Problem |
|------|----------|---------|
| `src/lib/investments.ts` | `getUserInvestmentsWithApplications()` | Falls back to unsafe client-side queries when RPC fails, bypassing Row Level Security. |
| `src/lib/notifications.ts` | `subscribeToNotifications()` | Returns channel subscription but doesn't provide cleanup mechanism for React components. |
| `src/lib/documents.ts` | `sendAdminNotification()` | Swallows notification errors silently, could leave critical processes incomplete. |

---

### 🔧 Updated Recommended Next Steps
1. Prioritise database-level issues (`investments`, migration grants).
2. Replace fallback client filters with secure server queries.
3. Ensure every realtime subscription exposes an unsubscribe method and is invoked on unmount.
4. Refactor legacy direct Supabase calls to go through the service layer.
5. Add comprehensive tests around auth session refresh and ProtectedRoute behaviour.
