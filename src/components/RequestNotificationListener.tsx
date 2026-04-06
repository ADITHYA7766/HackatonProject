import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Subscribes to listing_requests changes and shows popups when the seller receives
 * a new request or when the buyer's request is approved.
 */
export function RequestNotificationListener() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("listing-requests-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "listing_requests" },
        async (payload) => {
          const row = payload.new as { listing_id: string; requester_id: string };
          if (row.requester_id === user.id) return;

          const { data: listing } = await supabase
            .from("waste_listings")
            .select("title, user_id")
            .eq("id", row.listing_id)
            .maybeSingle();

          if (listing?.user_id === user.id) {
            setMessage(`You have Gotten a Buy request for the item: ${listing.title}`);
            setOpen(true);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "listing_requests" },
        async (payload) => {
          const row = payload.new as { listing_id: string; requester_id: string; status: string };
          const oldRow = payload.old as { status?: string } | null;
          if (row.requester_id !== user.id) return;
          if (row.status !== "approved") return;
          if (oldRow?.status === "approved") return;

          const { data: listing } = await supabase
            .from("waste_listings")
            .select("title")
            .eq("id", row.listing_id)
            .maybeSingle();

          if (listing?.title) {
            setMessage(`Your ${listing.title} buy request has been approved`);
            setOpen(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-left text-base font-normal leading-relaxed">{message}</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Dismiss to continue using the app.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setOpen(false)}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
