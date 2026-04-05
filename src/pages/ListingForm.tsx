import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Sparkles, X } from "lucide-react";
import { detectWasteFromImageFile } from "@/lib/wasteImageDetection";

const CATEGORIES = ["metal", "plastic", "chemical", "organic", "electronic", "textile", "glass", "other"];
const HAZARD_LEVELS = ["none", "low", "medium", "high"];
const UNITS = ["kg", "tons", "liters", "gallons", "units", "barrels", "cubic meters"];

const ListingForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<{
    category: string;
    suggested_title: string;
    hazard_level: string;
    confidence: number;
  } | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", category: "metal", quantity: "",
    unit: "kg", hazard_level: "none", price: "", currency: "USD",
    location: "", image_url: "",
  });

  /** Set `VITE_DETECTION_API_URL` to use the Python YOLO API (e.g. `http://127.0.0.1:8000` or `/api` with Vite proxy). Otherwise detection uses the browser model. */
  const detectionApiBase = import.meta.env.VITE_DETECTION_API_URL?.trim() ?? "";

  useEffect(() => {
    if (!user) navigate("/auth");
    if (isEdit) loadListing();
  }, [id, user]);

  const loadListing = async () => {
    const { data } = await supabase.from("waste_listings").select("*").eq("id", id!).single();
    if (data) {
      setForm({
        title: data.title, description: data.description || "", category: data.category,
        quantity: String(data.quantity), unit: data.unit, hazard_level: data.hazard_level,
        price: String(data.price || ""), currency: data.currency || "USD",
        location: data.location || "", image_url: data.image_url || "",
      });
      if (data.image_url) setImagePreview(data.image_url);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      // Auto-detect when image is selected
      detectWasteType(file);
    }
  };

  const applyDetection = (data: {
    category: string;
    suggested_title: string;
    hazard_level: string;
    confidence: number;
    sourceLabel?: string;
  }) => {
    setDetectionResult({
      category: data.category,
      suggested_title: data.suggested_title,
      hazard_level: data.hazard_level,
      confidence: data.confidence,
    });
    setForm((prev) => ({
      ...prev,
      category: data.category,
      title: data.suggested_title,
      hazard_level: data.hazard_level,
    }));
    const pct = (data.confidence * 100).toFixed(0);
    toast({
      title: "AI detection complete",
      description: data.sourceLabel
        ? `${data.sourceLabel} — ${data.suggested_title} (${pct}% confidence)`
        : `Detected: ${data.suggested_title} (${pct}% confidence)`,
    });
  };

  const detectWasteType = async (file: File) => {
    setDetecting(true);
    setDetectionResult(null);

    const tryRemote = async (): Promise<{
      category: string;
      suggested_title: string;
      hazard_level: string;
      confidence: number;
    } | null> => {
      if (!detectionApiBase) return null;
      const base = detectionApiBase.replace(/\/$/, "");
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch(`${base}/detect`, { method: "POST", body: formData });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.success || !data.category) return null;
      return {
        category: data.category,
        suggested_title: data.suggested_title ?? "Detected waste",
        hazard_level: data.hazard_level ?? "none",
        confidence: typeof data.confidence === "number" ? data.confidence : 0,
      };
    };

    try {
      const remote = await tryRemote().catch(() => null);
      if (remote) {
        applyDetection({ ...remote, sourceLabel: "YOLO API" });
        return;
      }

      const local = await detectWasteFromImageFile(file);
      if (local) {
        applyDetection({
          ...local,
          sourceLabel: "On-device (COCO)",
        });
        return;
      }

      toast({
        title: "Nothing detected",
        description: "Try a clearer photo of the waste item, or enter details manually.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Detection error:", error);
      toast({
        title: "Detection failed",
        description: "Could not analyze the image. Please fill the form manually.",
        variant: "destructive",
      });
    } finally {
      setDetecting(false);
    }
  };

  const clearDetection = () => {
    setDetectionResult(null);
    setForm(prev => ({
      ...prev,
      title: "",
      category: "metal",
      hazard_level: "none",
    }));
  };

  const uploadImage = async (currentImageUrl: string | null): Promise<string | null> => {
    if (!imageFile || !user) return currentImageUrl;
    const ext = imageFile.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("listing-images").upload(path, imageFile);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const image_url = await uploadImage(form.image_url);

    const payload = {
      title: form.title, description: form.description || null,
      category: form.category, quantity: parseFloat(form.quantity) || 0,
      unit: form.unit, hazard_level: form.hazard_level,
      price: form.price ? parseFloat(form.price) : 0,
      currency: form.currency, location: form.location || null,
      image_url, user_id: user.id,
    };

    if (isEdit) {
      const { error } = await supabase.from("waste_listings").update(payload).eq("id", id!);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Listing updated!" }); navigate(`/listings/${id}`); }
    } else {
      const { data, error } = await supabase.from("waste_listings").insert(payload).select().single();
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Listing created!" }); navigate(`/listings/${data.id}`); }
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Listing" : "Create New Listing"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Steel scrap from manufacturing" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the material, condition, and any special handling requirements..." rows={4} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hazard Level *</Label>
                <Select value={form.hazard_level} onValueChange={(v) => setForm({ ...form, hazard_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HAZARD_LEVELS.map((h) => <SelectItem key={h} value={h}>{h.charAt(0).toUpperCase() + h.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input id="quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required min="0" step="any" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} min="0" step="any" placeholder="0 = Free" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, State or Region" />
            </div>

            <div className="space-y-2">
              <Label>Image (Optional - AI Auto-Detection)</Label>
              <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => document.getElementById("image-input")?.click()}>
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    {detecting && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="text-white text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm">AI Detecting...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto" />
                    <p>Click to upload an image for AI detection</p>
                    <p className="text-xs">Auto-fills title, category & hazard level</p>
                  </div>
                )}
              </div>
              <input id="image-input" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

              {/* Detection Result Badge */}
              {detectionResult && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-green-600" />
                    <div className="text-sm">
                      <span className="font-medium text-green-800">AI Detected: </span>
                      <span className="text-green-700">
                        {detectionResult.suggested_title} ({(detectionResult.confidence * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearDetection}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : isEdit ? "Update Listing" : "Create Listing"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ListingForm;
