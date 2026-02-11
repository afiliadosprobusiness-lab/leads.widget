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

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPERADMIN_EMAILS.includes(email.toLowerCase());
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  signUp: (email: string, password: string, businessName?: string) => Promise<{ error: Error | null; data?: User }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithFacebook: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        if (isSuperAdminEmail(currentUser.email)) {
          setIsSuperAdmin(true);
          setLoading(false);
          return;
        }

        try {
          const roleDoc = await getDoc(doc(db, 'user_roles', currentUser.uid));
          setIsSuperAdmin(roleDoc.exists() && roleDoc.data().role === 'superadmin');
        } catch (err) {
          console.error('Error fetching roles:', err);
          setIsSuperAdmin(false);
        }
      } else {
        setIsSuperAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const bootstrapUserProfile = async (
    user: User,
    businessName?: string,
    referredBy?: string | null
  ): Promise<{ created: boolean; role: string }> => {
    const token = await user.getIdToken();
    const response = await fetch('/api/users/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        businessName: businessName || '',
        referredBy: referredBy || null,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || 'No se pudo sincronizar el perfil');
    }

    return {
      created: Boolean(payload?.created),
      role: payload?.role || 'client',
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

    return message;
  };

  const signUp = async (email: string, password: string, businessName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const referredBy = localStorage.getItem('leadwidget_ref') || null;
      if (referredBy) {
        console.log('New user referred by:', referredBy);
      }

      await bootstrapUserProfile(user, businessName || '', referredBy);
      if (referredBy) {
        localStorage.removeItem('leadwidget_ref');
      }

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

      const bootstrap = await bootstrapUserProfile(user, user.displayName || '', referredBy);
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

      const bootstrap = await bootstrapUserProfile(user, user.displayName || '', referredBy);
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
    setIsSuperAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isSuperAdmin, signUp, signIn, signInWithGoogle, signInWithFacebook, signOut }}>
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