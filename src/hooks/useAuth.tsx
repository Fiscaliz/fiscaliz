import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SignupExtra {
  profession?: string;
  activityTypes?: string[];
  areas?: string[];
  reportTools?: string[];
  trainingFiles?: File[];
  initialTemplate?: string;
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

    // Save onboarding fields to profile
    if (data.user && extra) {
      await supabase.from('profiles').update({
        profession: extra.profession || null,
        activity_types: extra.activityTypes ?? [],
        areas_of_practice: extra.areas ?? [],
        report_tools: extra.reportTools ?? [],
        initial_template: extra.initialTemplate || null,
        onboarding_completed: true,
      } as any).eq('id', data.user.id);

      // Upload AI training material (optional, best effort)
      if (extra.trainingFiles && extra.trainingFiles.length > 0) {
        for (const file of extra.trainingFiles) {
          const safe = file.name.replace(/[^\w.\-]+/g, '_');
          const path = `${data.user.id}/${Date.now()}-${safe}`;
          const { error: upErr } = await supabase.storage
            .from('ai-training')
            .upload(path, file, { upsert: false });
          if (!upErr) {
            await supabase.from('ai_training_documents').insert({
              user_id: data.user.id,
              name: file.name,
              file_path: path,
              file_size: file.size,
              mime_type: file.type || 'application/octet-stream',
            } as any);
          }
        }
      }
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
