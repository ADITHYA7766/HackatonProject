import { Badge } from "@/components/ui/badge";

const categoryIcons: Record<string, string> = {
  metal: "🔩", plastic: "♻️", chemical: "🧪", organic: "🌿",
  electronic: "💻", textile: "🧵", glass: "🪟", other: "📦",
};

const CategoryBadge = ({ category }: { category: string }) => (
  <Badge variant="secondary" className="text-xs">
    {categoryIcons[category] || "📦"} {category.charAt(0).toUpperCase() + category.slice(1)}
  </Badge>
);

export default CategoryBadge;
