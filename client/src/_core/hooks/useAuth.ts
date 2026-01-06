import { COOKIE_NAME } from "@shared/const";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();
  const [mockUser, setMockUser] = useState<any>(null);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.refetch();
    }
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
      setMockUser(null);
      localStorage.removeItem("echochat-mock-user");
      document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    },
  });

  const login = async (username: string) => {
    try {
      const { token, user } = await loginMutation.mutateAsync({ username });
      document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${60 * 60 * 24 * 365}`;

      setMockUser(user);
      localStorage.setItem("echochat-mock-user", JSON.stringify(user));
      await utils.auth.me.refetch();
      toast.success(`Welcome home, ${user.name}.`);
    } catch (e: any) {
      console.error("Login failed", e);
      toast.error(e.message || "The sanctuary doors are locked.");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("echochat-mock-user");
    if (saved && !meQuery.isLoading && !meQuery.data && meQuery.isError) {
      // Server says we are not logged in, but local storage says we are.
      // We should probably trust the server and clear local storage.
      localStorage.removeItem("echochat-mock-user");
      setMockUser(null);
    } else if (saved && !mockUser) {
      try {
        setMockUser(JSON.parse(saved));
      } catch (e) { }
    }
  }, [meQuery.data, meQuery.isLoading, meQuery.isError, mockUser]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      // ignore
    } finally {
      utils.auth.me.setData(undefined, null);
      setMockUser(null);
      localStorage.removeItem("echochat-mock-user");
      document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    // If we have meQuery data, use it. 
    // If not, and we are in dev, use mockUser for a faster/more stable transition.
    const user = meQuery.data || (import.meta.env.DEV ? mockUser : null);

    return {
      user,
      loading: meQuery.isLoading && !mockUser, // Don't show global loading if we have a mock fallback
      error: meQuery.error,
      isAuthenticated: Boolean(user),
    };
  }, [mockUser, meQuery.data, meQuery.isLoading, meQuery.error]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
    login,
  };
}
