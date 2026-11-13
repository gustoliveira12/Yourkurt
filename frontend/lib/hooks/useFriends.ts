"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export type Friend = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
};

type RawFriendship = {
  requester_id: string;
  addressee_id: string;
  requester: Friend | Friend[] | null;
  addressee: Friend | Friend[] | null;
};

function normalizeFriend(value: Friend | Friend[] | null): Friend | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// Result of the last fetch, tagged with the limit it answers.
// `loading` is derived from it, so the effect never sets state synchronously.
type FriendsState = {
  limit: number;
  friends: Friend[];
};

const NO_FRIENDS: Friend[] = [];

export function useFriends(limit: number = 6) {
  const [state, setState] = useState<FriendsState | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFriends() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active) setState({ limit, friends: [] });
        return;
      }

      // Fetch accepted friendships where current user is either requester or addressee
      const { data } = await supabase
        .from("friendships")
        .select<string, RawFriendship>(
          "requester_id, addressee_id, requester:requester_id(id, name, username, avatar_url), addressee:addressee_id(id, name, username, avatar_url)",
        )
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .limit(limit);

      if (!active) return;

      const friendsList: Friend[] = (data ?? [])
        .map((friendship) => {
          // Return the friend that is NOT the current user
          const friend =
            friendship.requester_id === user.id
              ? friendship.addressee
              : friendship.requester;
          return normalizeFriend(friend);
        })
        .filter((friend): friend is Friend => friend !== null);

      setState({ limit, friends: friendsList });
    }

    void loadFriends();
    return () => {
      active = false;
    };
  }, [limit]);

  const current = state?.limit === limit ? state : null;

  return { friends: current?.friends ?? NO_FRIENDS, loading: !current };
}
