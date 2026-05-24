import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { clearAuthToken, getAuthToken, setAuthToken } from "./tokenStorage";
import { getMe, login as loginRequest, register as registerRequest } from "./api";
import type { AuthUser, LoginInput, RegisterInput } from "./types";
import { isBackendUnavailable } from "@/lib/apiClient";

type AuthContextValue = {
  user?: AuthUser;
  token?: string;
  initializing: boolean;
  authenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | undefined>();
  const [token, setToken] = useState<string | undefined>();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      const storedToken = await getAuthToken();
      if (!mounted) return;
      setToken(storedToken);
      if (!storedToken) {
        setInitializing(false);
        return;
      }

      try {
        const me = await getMe();
        if (mounted) setUser(me);
      } catch (error) {
        if (isBackendUnavailable(error)) {
          if (mounted) setUser({ id: "offline", email: "offline_session" });
        } else {
          await clearAuthToken();
          if (mounted) setToken(undefined);
        }
      } finally {
        if (mounted) setInitializing(false);
      }
    }

    hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await loginRequest(input);
      await setAuthToken(response.accessToken);
      setToken(response.accessToken);
      setUser(response.user);
      await queryClient.invalidateQueries();
    },
    [queryClient]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await registerRequest(input);
      await setAuthToken(response.accessToken);
      setToken(response.accessToken);
      setUser(response.user);
      await queryClient.invalidateQueries();
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    await clearAuthToken();
    setToken(undefined);
    setUser(undefined);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, token, initializing, authenticated: Boolean(token && user), login, register, logout }),
    [initializing, login, logout, register, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
