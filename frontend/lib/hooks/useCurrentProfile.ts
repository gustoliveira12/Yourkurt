"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export type CurrentProfile = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  headerUrl: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

const supabase = createClient();

export function useCurrentProfile() {
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, name, username, avatar_url, header_url")
        .eq("id", user.id)
        .maybeSingle();

      const fallbackName =
        user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Usuário";
      const fallbackUsername =
        user.user_metadata?.username ??
        user.email?.split("@")[0]?.toLowerCase() ??
        "usuario";

      const { data: permissionsData } = await supabase.rpc(
        "get_current_user_permissions",
      );

      const isAdmin = Array.isArray(permissionsData)
        ? Boolean(permissionsData[0]?.is_admin)
        : false;
      const isSuperAdmin = Array.isArray(permissionsData)
        ? Boolean(permissionsData[0]?.is_super_admin)
        : false;

      setProfile({
        id: user.id,
        name: data?.name ?? fallbackName,
        username: data?.username ?? fallbackUsername,
        avatarUrl: data?.avatar_url ?? null,
        headerUrl: data?.header_url ?? null,
        isAdmin,
        isSuperAdmin,
      });

      setLoading(false);
    }

    void loadProfile();
  }, []);

  return { profile, loading };
}
