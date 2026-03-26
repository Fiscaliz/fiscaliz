import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SignupExtra {
  userType?: string;
  institutionalLink?: string;
  institutionName?: string;
  areasOfPractice?: string[];
  logoFile?: File | null;
  city?: string;
  state?: string;
  organName?: string;
  pdfHeaderText?: string;
  customLegislations?: string[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, extra?: SignupExtra) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string, extra?: SignupExtra) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });

    if (error) return { error: error as Error | null };

    // Save extra fields to profiles after signup
    if (data.user && extra) {
      let logoUrl: string | null = null;

      // Upload logo if provided
      if (extra.logoFile) {
        const ext = extra.logoFile.name.split('.').pop();
        const path = `logos/${data.user.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('fiscal-photos')
          .upload(path, extra.logoFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = await supabase.storage
            .from('fiscal-photos')
            .createSignedUrl(path, 60 * 60 * 24 * 365);
          logoUrl = urlData?.signedUrl ?? null;
        }
      }

      await supabase.from('profiles').update({
        user_type: extra.userType,
        institutional_link: extra.institutionalLink,
        institution_name: extra.institutionName || null,
        institution_logo_url: logoUrl,
        areas_of_practice: extra.areasOfPractice,
        city: extra.city || null,
        state: extra.state || null,
        organ_name: extra.organName || null,
        pdf_header_text: extra.pdfHeaderText || null,
        custom_legislations: extra.customLegislations || [],
      } as any).eq('id', data.user.id);
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
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
