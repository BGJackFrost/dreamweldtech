import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

// Token storage key for local auth
const ADMIN_TOKEN_KEY = "dreamweldtech_admin_token";

// Helper functions for local auth token
export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function removeAdminToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();

  // Check for local auth token first
  const localToken = getAdminToken();

  // Query OAuth user
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Query local auth user if token exists
  const localMeQuery = trpc.adminAuth.me.useQuery(
    { token: localToken || "" },
    {
      enabled: !!localToken,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      // Clear local auth token
      removeAdminToken();
      
      // Also logout from OAuth if applicable
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      // Don't throw, just log - we still want to clear local state
      console.warn('[Auth] Logout error:', error);
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      // Redirect to login page
      window.location.href = '/admin/login';
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    // Prioritize local auth user if available
    const localUser = localMeQuery.data?.user;
    const oauthUser = meQuery.data;
    const user = localUser || oauthUser || null;

    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(user)
    );

    return {
      user,
      loading: meQuery.isLoading || (!!localToken && localMeQuery.isLoading) || logoutMutation.isPending,
      error: meQuery.error ?? localMeQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(user),
      isLocalAuth: Boolean(localUser),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    localMeQuery.data,
    localMeQuery.error,
    localMeQuery.isLoading,
    localToken,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (localToken && localMeQuery.isLoading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    
    // Redirect to admin login page
    const loginUrl = redirectPath || '/admin/login';
    if (window.location.pathname === loginUrl) return;
    if (window.location.pathname.startsWith('/admin/login')) return;

    window.location.href = loginUrl;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    localMeQuery.isLoading,
    localToken,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => {
      meQuery.refetch();
      if (localToken) localMeQuery.refetch();
    },
    logout,
  };
}
