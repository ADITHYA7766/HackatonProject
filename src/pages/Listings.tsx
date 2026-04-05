import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Plus, Loader2 } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES = ["all", "metal", "plastic", "chemical", "organic", "electronic", "textile", "glass", "other"];
const HAZARD_LEVELS = ["all", "none", "low", "medium", "high"];

const Listings = () => {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [hazard, setHazard] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    fetchListings();
  }, [category, hazard, search]);

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase.from("waste_listings").select("*").eq("status", "active").order("created_at", { ascending: false });
    if (category !== "all") query = query.eq("category", category);
    if (hazard !== "all") query = query.eq("hazard_level", hazard);
    if (search) query = query.ilike("title", `%${search}%`);
    const { data } = await query;
    setListings(data || []);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Browse Listings</h1>
        {user && (
          <Link to="/listings/new">
            <Button><Plus className="h-4 w-4 mr-2" /> New Listing</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search listings..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </form>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={hazard} onValueChange={setHazard}>
          <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Hazard Level" /></SelectTrigger>
          <SelectContent>
            {HAZARD_LEVELS.map((h) => (
              <SelectItem key={h} value={h}>{h === "all" ? "All Hazard Levels" : h.charAt(0).toUpperCase() + h.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <p className="text-xl text-muted-foreground">No listings found</p>
          {user && <Link to="/listings/new"><Button>Create the first listing</Button></Link>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((l) => <ListingCard key={l.id} {...l} />)}
        </div>
      )}
    </div>
  );
};

export default Listings;
