import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Recycle, Plus, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Recycle className="h-7 w-7 text-primary" />
          <span className="text-foreground">Waste<span className="text-primary">Xchange</span></span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/listings" className="text-muted-foreground hover:text-foreground transition-colors">
            Browse
          </Link>
          {user ? (
            <>
              <Link to="/my-listings" className="text-muted-foreground hover:text-foreground transition-colors">
                My Listings
              </Link>
              <Link to="/my-requests" className="text-muted-foreground hover:text-foreground transition-colors">
                Requests
              </Link>
              <Button onClick={() => navigate("/listings/new")} size="sm">
                <Plus className="h-4 w-4 mr-1" /> List Waste
              </Button>
              <Link to="/profile">
                <Button variant="ghost" size="icon"><User className="h-5 w-5" /></Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-card px-4 pb-4 space-y-2">
          <Link to="/listings" className="block py-2 text-muted-foreground" onClick={() => setMobileOpen(false)}>Browse</Link>
          {user ? (
            <>
              <Link to="/my-listings" className="block py-2 text-muted-foreground" onClick={() => setMobileOpen(false)}>My Listings</Link>
              <Link to="/my-requests" className="block py-2 text-muted-foreground" onClick={() => setMobileOpen(false)}>Requests</Link>
              <Link to="/listings/new" className="block py-2 text-muted-foreground" onClick={() => setMobileOpen(false)}>List Waste</Link>
              <Link to="/profile" className="block py-2 text-muted-foreground" onClick={() => setMobileOpen(false)}>Profile</Link>
              <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="block py-2 text-destructive">Sign Out</button>
            </>
          ) : (
            <Link to="/auth" className="block py-2 text-primary font-medium" onClick={() => setMobileOpen(false)}>Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
