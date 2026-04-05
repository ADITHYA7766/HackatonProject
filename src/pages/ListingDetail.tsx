import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Loader2, Send, Edit, Trash2 } from "lucide-react";
import HazardBadge from "@/components/HazardBadge";
import CategoryBadge from "@/components/CategoryBadge";
import { useToast } from "@/hooks/use-toast";

const ListingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listing, setListing] = useState<{
    id: string;
    title: string;
    description: string | null;
    category: string;
    quantity: number;
    unit: string;
    hazard_level: string;
    price: number | null;
    currency: string | null;
    location: string | null;
    image_url: string | null;
    user_id: string;
    status: string;
    created_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [requests, setRequests] = useState<Array<{
    id: string;
    listing_id: string;
    requester_id: string;
    message: string | null;
    status: string;
    created_at: string;
  }>>([]);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("waste_listings").select("*").eq("id", id).single();
    if (error) {
      toast({
        title: "Error loading listing",
        description: error.message,
        variant: "destructive"
      });
      setListing(null);
    } else {
      setListing(data);
      if (user) {
        const { data: reqs, error: reqError } = await supabase.from("listing_requests").select("*").eq("listing_id", id!);
        if (reqError) {
          toast({ title: "Error loading requests", description: reqError.message, variant: "destructive" });
        }
        setRequests(reqs || []);
      }
    }
    setLoading(false);
  };

  const handleRequest = async () => {
    if (!user) return navigate("/auth");
    setSending(true);
    const { error } = await supabase.from("listing_requests").insert({
      listing_id: id!,
      requester_id: user.id,
      message,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request sent!", description: "The seller will review your request." });
      setMessage("");
      fetchListing();
    }
    setSending(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    const { error } = await supabase.from("waste_listings").delete().eq("id", id!);
    if (error) {
      toast({
        title: "Error deleting listing",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Listing deleted successfully" });
      navigate("/my-listings");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!listing) return <div className="text-center py-20 text-muted-foreground">Listing not found</div>;

  const isOwner = user?.id === listing.user_id;
  const alreadyRequested = requests.some((r) => r.requester_id === user?.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
          {listing.image_url ? (
            <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-accent">📦</div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <CategoryBadge category={listing.category} />
              <HazardBadge level={listing.hazard_level} />
              <Badge variant={listing.status === "active" ? "default" : "secondary"}>{listing.status}</Badge>
            </div>
            <h1 className="text-3xl font-bold">{listing.title}</h1>
          </div>

          <div className="text-3xl font-bold text-primary">
            {listing.price ? `${listing.currency || "$"}${listing.price.toLocaleString()}` : "Free"}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Quantity</span>
              <p className="font-medium">{listing.quantity} {listing.unit}</p>
            </div>
            {listing.location && (
              <div className="space-y-1">
                <span className="text-muted-foreground">Location</span>
                <p className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> {listing.location}</p>
              </div>
            )}
            <div className="space-y-1">
              <span className="text-muted-foreground">Listed</span>
              <p className="font-medium flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(listing.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {listing.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}

          {isOwner ? (
            <div className="flex gap-3">
              <Button onClick={() => navigate(`/listings/${id}/edit`)} className="flex-1"><Edit className="h-4 w-4 mr-2" /> Edit</Button>
              <Button variant="destructive" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">Request this material</h3>
                {alreadyRequested ? (
                  <p className="text-sm text-muted-foreground">You've already sent a request for this listing.</p>
                ) : (
                  <>
                    <Textarea placeholder="Introduce yourself and explain your interest..." value={message} onChange={(e) => setMessage(e.target.value)} />
                    <Button onClick={handleRequest} disabled={sending} className="w-full">
                      <Send className="h-4 w-4 mr-2" /> {sending ? "Sending..." : "Send Request"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Requests for owner */}
      {isOwner && requests.length > 0 && (
        <div className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold">Requests ({requests.length})</h2>
          {requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                  <p className="mt-1">{r.message || "No message"}</p>
                  <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"} className="mt-2">
                    {r.status}
                  </Badge>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={async () => {
                      const { error } = await supabase.from("listing_requests").update({ status: "approved" }).eq("id", r.id);
                      if (error) {
                        toast({ title: "Error approving request", description: error.message, variant: "destructive" });
                      } else {
                        toast({ title: "Request approved" });
                        fetchListing();
                      }
                    }}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={async () => {
                      const { error } = await supabase.from("listing_requests").update({ status: "rejected" }).eq("id", r.id);
                      if (error) {
                        toast({ title: "Error rejecting request", description: error.message, variant: "destructive" });
                      } else {
                        toast({ title: "Request rejected" });
                        fetchListing();
                      }
                    }}>Reject</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListingDetail;
