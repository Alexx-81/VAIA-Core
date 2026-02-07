import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase/client';
import type { Employee, EmployeePermission } from '../../lib/supabase/types';
import type { TabId } from '../components/Tabs/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  employee: Employee | null;
  permissions: TabId[];
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshEmployee: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define allTabs outside component to avoid re-creating on each render
const ALL_TABS: TabId[] = ['dashboard', 'qualities', 'articles', 'deliveries', 'sales', 'inventory', 'reports', 'settings'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [permissions, setPermissions] = useState<TabId[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadEmployeeData = useCallback(async (authUserId: string): Promise<Employee | null> => {
    try {
      // Get employee record
      const { data: emp, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (empError || !emp) {
        console.error('Employee not found for auth user:', authUserId, empError);
        setEmployee(null);
        setPermissions([]);
        setIsAdmin(false);
        setAuthError('Нямате достъп. Потребителят не е добавен като служител.');
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        return null;
      }

      // Check if former employee
      if (emp.is_former) {
        await supabase.auth.signOut();
        setEmployee(null);
        setPermissions([]);
        setIsAdmin(false);
        setSession(null);
        setUser(null);
        setAuthError('Акаунтът е деактивиран. Свържете се с администратора.');
        return null;
      }

      setEmployee(emp);
      setAuthError(null);
      const admin = emp.role === 'admin';
      setIsAdmin(admin);

      if (admin) {
        // Admins have access to all tabs + admin
        setPermissions([...ALL_TABS, 'admin'] as TabId[]);
      } else {
        // Load permissions for non-admins
        const { data: perms } = await supabase
          .from('employee_permissions')
          .select('*')
          .eq('employee_id', emp.id);

        const allowedTabs = (perms || [])
          .filter((p: EmployeePermission) => p.can_access)
          .map((p: EmployeePermission) => p.tab_id as TabId);

        setPermissions(allowedTabs);
      }
      return emp;
    } catch (err) {
      console.error('Error loading employee data:', err);
      setAuthError('Възникна грешка при зареждане на данните за служителя.');
      return null;
    }
  }, []);

  const refreshEmployee = useCallback(async () => {
    if (user) {
      await loadEmployeeData(user.id);
    }
  }, [user, loadEmployeeData]);

  // Step 1: Listen for auth state changes — SYNCHRONOUS only (no await inside!)
  // This avoids blocking Supabase's internal auth processing in Chrome.
  useEffect(() => {
    let isMounted = true;
    let gotEvent = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        if (!isMounted) return;
        console.log('Auth event:', event, s?.user?.email);
        gotEvent = true;

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setEmployee(null);
          setPermissions([]);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // For ALL other events (INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, etc.)
        // just store the session/user. Employee loading happens in the next useEffect.
        setSession(s);
        setUser(s?.user ?? null);

        // If no user in session, stop loading immediately (show login)
        if (!s?.user) {
          setEmployee(null);
          setPermissions([]);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    // Safety: if no auth event fires within 5s (corrupted storage, network),
    // clear state and show login
    const safetyTimeout = setTimeout(() => {
      if (isMounted && !gotEvent) {
        console.warn('Auth: No auth event received, clearing stored session');
        localStorage.removeItem('sb-ptigdekgzraimaepgczt-auth-token');
        setSession(null);
        setUser(null);
        setEmployee(null);
        setPermissions([]);
        setIsAdmin(false);
        setLoading(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Step 2: When user changes, load employee data OUTSIDE the auth callback
  useEffect(() => {
    if (user) {
      let cancelled = false;
      setLoading(true);
      loadEmployeeData(user.id).then(() => {
        if (!cancelled) setLoading(false);
      });
      return () => { cancelled = true; };
    }
  }, [user, loadEmployeeData]);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    setAuthError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error('Auth: sign in error', error);
        if (error.message?.includes('banned') || error.message?.includes('disabled')) {
          return { error: 'Акаунтът е деактивиран. Свържете се с администратора.' };
        }
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
          return { error: 'Проблем с връзката. Проверете интернет връзката си.' };
        }
        return { error: 'Невалиден имейл или парола.' };
      }

      // Success — onAuthStateChange SIGNED_IN event will handle setting
      // session, user, employee, and permissions automatically
      return {};
    } catch (err: any) {
      console.error('Auth: sign in exception', err);
      return { error: err.message || 'Възникна неочаквана грешка при вход.' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setEmployee(null);
    setPermissions([]);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      employee,
      permissions,
      isAdmin,
      loading,
      authError,
      signIn,
      signOut,
      refreshEmployee,
      clearAuthError: () => setAuthError(null),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
