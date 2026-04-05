import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const hazardStyles: Record<string, string> = {
  none: "bg-hazard-none/15 text-hazard-none border-hazard-none/30",
  low: "bg-hazard-low/15 text-hazard-low border-hazard-low/30",
  medium: "bg-hazard-medium/15 text-hazard-medium border-hazard-medium/30",
  high: "bg-hazard-high/15 text-hazard-high border-hazard-high/30",
};

const HazardBadge = ({ level }: { level: string }) => (
  <Badge variant="outline" className={cn("text-xs font-medium", hazardStyles[level] || hazardStyles.none)}>
    {level === "none" ? "No Hazard" : `${level.charAt(0).toUpperCase() + level.slice(1)} Hazard`}
  </Badge>
);

export default HazardBadge;
