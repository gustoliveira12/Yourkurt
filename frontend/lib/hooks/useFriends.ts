"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

export type Friend = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
};

export function useFriends(limit: number = 6) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch accepted friendships where current user is either requester or addressee
    const { data } = await supabase
      .from("friendships")
      .select(
        "requester_id, addressee_id, requester:requester_id(id, name, username, avatar_url), addressee:addressee_id(id, name, username, avatar_url)",
      )
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .limit(limit);

    if (data) {
      const friendsList: Friend[] = data
        .map((friendship: any) => {
          // Return the friend that is NOT the current user
          if (friendship.requester_id === user.id) {
            return friendship.addressee;
          } else {
            return friendship.requester;
          }
        })
        .filter(Boolean);

      setFriends(friendsList);
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    void fetchFriends();
  }, [fetchFriends]);

  return { friends, loading };
}
