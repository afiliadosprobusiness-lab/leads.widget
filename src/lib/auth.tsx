import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export const SUPERADMIN_EMAILS = [
  'afiliadosprobusiness@gmail.com',
  'superadmin@leadwidget.pe',
  'superadmin2@leadwidget.pe',
];

export type AppRole = 'client' | 'superadmin' | 'partner_admin' | 'partner_staff';

interface SignUpOptions {
  accountType?: 'client' | 'partner';
  partnerCode?: string | null;
  partnerName?: string;
  inviteCode?: string | null;
}

interface BootstrapPayload {
  created: boolean;
  role: AppRole;
  partner_id?: string | null;
  partner_code?: string | null;
}

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPERADMIN_EMAILS.includes(email.toLowerCase());
}

function normalizeAppRole(role?: string | null): AppRole {
  const candidate = String(role || '').trim().toLowerCase();
  if (candidate === 'superadmin') return 'superadmin';
  if (candidate === 'partner_admin' || candidate === 'admin') return 'partner_admin';
  if (candidate === 'partner_staff' || candidate === 'staff') return 'partner_staff';
  return 'client';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: AppRole;
  isSuperAdmin: boolean;
  isPartner: boolean;
  partnerId: string | null;
  partnerCode: string | null;
  signUp: (email: string, password: string, businessName?: string, options?: SignUpOptions) => Promise<{ error: Error | null; data?: User }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithFacebook: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole>('client');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerCode, setPartnerCode] = useState<string | null>(null);
  const { toast } = useToast();

  const setRoleState = (nextRole: AppRole, options?: { partnerId?: string | null; partnerCode?: string | null }) => {
    const normalized = normalizeAppRole(nextRole);
    setRole(normalized);
    setIsSuperAdmin(normalized === 'superadmin');
    setIsPartner(normalized === 'partner_admin' || normalized === 'partner_staff');
    setPartnerId(options?.partnerId ?? null);
    setPartnerCode(options?.partnerCode ?? null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const bootstrap = await bootstrapUserProfile(currentUser, currentUser.displayName || '');
          const bootstrapRole = normalizeAppRole(bootstrap.role);

          if (isSuperAdminEmail(currentUser.email) || bootstrapRole === 'superadmin') {
            setRoleState('superadmin');
          } else if (bootstrapRole === 'partner_admin' || bootstrapRole === 'partner_staff') {
            setRoleState(bootstrapRole, {
              partnerId: bootstrap.partner_id || null,
              partnerCode: bootstrap.partner_code || null,
            });
          } else {
            const roleDoc = await getDoc(doc(db, 'user_roles', currentUser.uid));
            if (roleDoc.exists() && roleDoc.data().role === 'superadmin') {
              setRoleState('superadmin');
            } else {
              setRoleState('client', {
                partnerId: bootstrap.partner_id || null,
                partnerCode: bootstrap.partner_code || null,
              });
            }
          }
        } catch (err) {
          console.error('Error fetching roles:', err);
          setRoleState(isSuperAdminEmail(currentUser.email) ? 'superadmin' : 'client');
        }
      } else {
        setRoleState('client');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const bootstrapUserProfile = async (
    user: User,
    businessName?: string,
    referredBy?: string | null,
    options?: SignUpOptions
  ): Promise<BootstrapPayload> => {
    const token = await user.getIdToken();

    const preferredPartnerCode = options?.partnerCode || localStorage.getItem('leadwidget_partner_code') || null;
    const preferredInviteCode = options?.inviteCode || localStorage.getItem('leadwidget_partner_invite') || null;

    const response = await fetch('/api/users/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        businessName: businessName || '',
        referredBy: referredBy || null,
        accountType: options?.accountType || 'client',
        partnerCode: preferredPartnerCode,
        partnerName: options?.partnerName || businessName || '',
        inviteCode: preferredInviteCode,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || 'No se pudo sincronizar el perfil');
    }

    return {
      created: Boolean(payload?.created),
      role: normalizeAppRole(payload?.role),
      partner_id: payload?.partner_id || null,
      partner_code: payload?.partner_code || null,
    };
  };

  const humanError = (error: any, fallback: string) => {
    let message = fallback;
    if (error.code === 'auth/email-already-in-use') message = 'El correo ya está registrado';
    if (error.code === 'auth/weak-password') message = 'La contraseña es muy débil';
    if (error.code === 'auth/invalid-credential') message = 'Credenciales incorrectas';
    if (error.code === 'auth/user-not-found') message = 'Usuario no encontrado';
    if (error.code === 'auth/wrong-password') message = 'Contraseña incorrecta';
    if (error.code === 'auth/popup-closed-by-user') message = 'Ventana de inicio de sesión cerrada';
    if (error.code === 'auth/popup-blocked') message = 'Popup bloqueado. Permite popups para este sitio';
    if (error.code === 'auth/cancelled-popup-request') message = 'Solicitud cancelada';
    if (error.code === 'auth/account-exists-with-different-credential') {
      message = 'Ya existe una cuenta con este correo usando otro método de inicio de sesión';
    }

    const raw = String(error?.message || '');
    if (raw.includes('ERR_BLOCKED_BY_CLIENT')) {
      message = 'Tu navegador está bloqueando Firebase. Desactiva AdBlock/Shield para este sitio.';
    }
    if (raw.includes('auth/unauthorized-domain') || raw.includes('Illegal url for new iframe')) {
      message = 'Dominio no autorizado en Firebase Auth. Agrega este dominio en Firebase > Authentication > Settings > Authorized domains.';
    }

    return message;
  };

  const signUp = async (email: string, password: string, businessName?: string, options?: SignUpOptions) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const referredBy = localStorage.getItem('leadwidget_ref') || null;
      if (referredBy) {
        console.log('New user referred by:', referredBy);
      }

      await bootstrapUserProfile(user, businessName || '', referredBy, options);
      if (referredBy) {
        localStorage.removeItem('leadwidget_ref');
      }
      localStorage.removeItem('leadwidget_partner_code');
      localStorage.removeItem('leadwidget_partner_invite');

      toast({
        title: '¡Bienvenido!',
        description: 'Tu cuenta ha sido creada exitosamente.',
      });

      return { error: null, data: user };
    } catch (error: any) {
      console.error('Sign Up Error:', error);
      return { error: { ...error, message: humanError(error, 'Error al registrarse') } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error: any) {
      console.error('Sign In Error:', error);
      return { error: { ...error, message: humanError(error, 'Error al iniciar sesión') } };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const referredBy = localStorage.getItem('leadwidget_ref') || null;
      if (referredBy) {
        console.log('New user referred by:', referredBy);
      }

      const bootstrap = await bootstrapUserProfile(user, user.displayName || '', referredBy, {
        accountType: 'client',
      });
      if (referredBy) {
        localStorage.removeItem('leadwidget_ref');
      }

      if (bootstrap.created) {
        toast({
          title: '¡Bienvenido!',
          description: 'Tu cuenta ha sido creada exitosamente con Google.',
        });
      }

      return { error: null };
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      return { error: { ...error, message: humanError(error, 'Error al iniciar sesión con Google') } };
    }
  };

  const signInWithFacebook = async () => {
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const referredBy = localStorage.getItem('leadwidget_ref') || null;
      if (referredBy) {
        console.log('New user referred by:', referredBy);
      }

      const bootstrap = await bootstrapUserProfile(user, user.displayName || '', referredBy, {
        accountType: 'client',
      });
      if (referredBy) {
        localStorage.removeItem('leadwidget_ref');
      }

      if (bootstrap.created) {
        toast({
          title: '¡Bienvenido!',
          description: 'Tu cuenta ha sido creada exitosamente con Facebook.',
        });
      }

      return { error: null };
    } catch (error: any) {
      console.error('Facebook Sign In Error:', error);
      return { error: { ...error, message: humanError(error, 'Error al iniciar sesión con Facebook') } };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setRoleState('client');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      role,
      isSuperAdmin,
      isPartner,
      partnerId,
      partnerCode,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithFacebook,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
