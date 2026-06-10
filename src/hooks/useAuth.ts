import { useCallback, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export function useAuth() {
  const utils = trpc.useUtils();
  const navigate = useNavigate();

  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem("qc_auth_token");
      utils.invalidate();
      toast.success("Logged out successfully");
      navigate("/");
    },
  });

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const isAdmin = useMemo(() => user?.role === "admin", [user]);

  const isSubscribed = useMemo(() => {
    return user?.subscriptionStatus === "active" || user?.subscriptionStatus === "trialing";
  }, [user]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin,
    isSubscribed,
    logout,
  };
}
