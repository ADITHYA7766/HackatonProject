import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import HazardBadge from "./HazardBadge";
import CategoryBadge from "./CategoryBadge";

interface ListingCardProps {
  id: string;
  title: string;
  category: string;
  quantity: number;
  unit: string;
  hazard_level: string;
  price: number | null;
  currency: string | null;
  location: string | null;
  image_url: string | null;
}

const ListingCard = ({ id, title, category, quantity, unit, hazard_level, price, currency, location, image_url }: ListingCardProps) => (
  <Link to={`/listings/${id}`}>
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
      <div className="aspect-video bg-muted overflow-hidden">
        {image_url ? (
          <img src={image_url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-accent">
            {category === "metal" ? "🔩" : category === "plastic" ? "♻️" : category === "chemical" ? "🧪" : "📦"}
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-1">{title}</h3>
        <div className="flex gap-2 flex-wrap">
          <CategoryBadge category={category} />
          <HazardBadge level={hazard_level} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{quantity} {unit}</span>
          <span className="font-bold text-primary">
            {price ? `${currency || "$"}${price.toLocaleString()}` : "Free"}
          </span>
        </div>
        {location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {location}
          </div>
        )}
      </CardContent>
    </Card>
  </Link>
);

export default ListingCard;
