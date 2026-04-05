import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import type { Database } from "@/integrations/supabase/types";

type WasteListingRow = Database["public"]["Tables"]["waste_listings"]["Row"];

const MyListings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<WasteListingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    supabase.from("waste_listings").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setListings(data || []); setLoading(false); });
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Listings</h1>
        <Link to="/listings/new"><Button><Plus className="h-4 w-4 mr-2" /> New Listing</Button></Link>
      </div>
      {listings.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <p className="text-xl text-muted-foreground">You haven't created any listings yet</p>
          <Link to="/listings/new"><Button>Create your first listing</Button></Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((l) => <ListingCard key={l.id} {...l} />)}
        </div>
      )}
    </div>
  );
};

export default MyListings;
