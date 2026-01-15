import { supabase } from "@/lib/supabase";
import { AuthError, Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

// Interface para o retorno do nosso hook
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
  logout: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    // 1. Tenta pegar a sessão inicial.
    // Isso é rápido e verifica se o usuário já está logado.
    const getInitialSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setError(error);
        console.error("Erro ao buscar sessão:", error.message);
      } else {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      }
      setLoading(false);
    };

    getInitialSession();

    // 2. Escuta por mudanças no estado de autenticação.
    // Isso é o que nos permite reagir a logins e logouts em tempo real.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Se o usuário deslogou, redireciona para a página de login
        if (_event === 'SIGNED_OUT') {
          navigate('/login');
        }
      }
    );

    // 3. Limpa o "ouvinte" quando o componente é desmontado.
    // Isso evita vazamentos de memória.
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // Função de logout
  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error);
      console.error("Erro ao fazer logout:", error.message);
    }
    // O listener onAuthStateChange vai cuidar de atualizar o estado e redirecionar
    setLoading(false);
  };

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user, // Se existe um usuário, ele está autenticado.
    error,
    logout,
  };
}
