import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Recycle, Shield, TrendingUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  { icon: Recycle, title: "Reduce Waste", desc: "Turn industrial by-products into valuable resources for other businesses." },
  { icon: Shield, title: "Safe Exchange", desc: "Hazard-level labeling and verified listings ensure safe material handling." },
  { icon: TrendingUp, title: "Cost Savings", desc: "Save on raw materials by sourcing affordable industrial waste." },
];

const categories = [
  { name: "Metal Scraps", emoji: "🔩", count: "120+" },
  { name: "Plastics", emoji: "♻️", count: "85+" },
  { name: "Chemicals", emoji: "🧪", count: "60+" },
  { name: "Electronics", emoji: "💻", count: "45+" },
  { name: "Textiles", emoji: "🧵", count: "30+" },
  { name: "Organic", emoji: "🌿", count: "55+" },
];

const Index = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/listings?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Industrial facility" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 to-foreground/60" />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-36">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary-foreground leading-tight">
              One Industry's Waste,<br />
              <span className="text-secondary">Another's Resource</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-lg">
              Connect with industries to exchange waste materials — reducing environmental harm while creating value.
            </p>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search metal scraps, chemicals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-card/95 border-0 h-12"
                />
              </div>
              <Button type="submit" size="lg" className="h-12">Search</Button>
            </form>
            <div className="flex gap-3 pt-2">
              <Link to="/listings">
                <Button variant="outline" className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20">
                  Browse Listings <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why WasteXchange?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="text-center space-y-4 p-6 rounded-2xl border bg-card hover:shadow-md transition-shadow">
              <div className="mx-auto w-14 h-14 rounded-xl bg-accent flex items-center justify-center">
                <f.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((c) => (
              <Link
                key={c.name}
                to={`/listings?category=${c.name.toLowerCase().split(" ")[0]}`}
                className="flex flex-col items-center gap-2 p-6 rounded-xl border bg-card hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <span className="text-4xl">{c.emoji}</span>
                <span className="font-medium text-sm">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.count} listings</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 container mx-auto px-4 text-center">
        <div className="gradient-hero rounded-3xl p-12 md:p-16 space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">Ready to Exchange?</h2>
          <p className="text-primary-foreground/80 max-w-md mx-auto">
            Join hundreds of industries turning waste into value. List your materials or find what you need.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Recycle className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">WasteXchange</span>
          </div>
          <p>© 2026 WasteXchange. Turning waste into opportunity.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
