import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

import type { Database } from "@/integrations/supabase/types";

type ListingRequestRow = Database["public"]["Tables"]["listing_requests"]["Row"];
type WasteListingPreview = Pick<Database["public"]["Tables"]["waste_listings"]["Row"], "id" | "title" | "category">;
type ListingRequestWithListing = ListingRequestRow & { waste_listings: WasteListingPreview | null };

const statusVariant = (s: string) => s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";

const MyRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ListingRequestWithListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    supabase.from("listing_requests").select("*, waste_listings(id, title, category)")
      .eq("requester_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setRequests(data || []); setLoading(false); });
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Requests</h1>
      {requests.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-muted-foreground">No requests yet</p>
          <Link to="/listings" className="text-primary hover:underline mt-2 inline-block">Browse listings</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <Link key={r.id} to={`/listings/${r.waste_listings?.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <h3 className="font-semibold">{r.waste_listings?.title || "Listing"}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{r.message || "No message"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequests;
