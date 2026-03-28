import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Camera,
  CircleHelp,
  Clapperboard,
  Film,
  Folder,
  Gamepad2,
  History,
  Music4,
  Plus,
  Settings,
  Sparkles,
  Tv,
  UtensilsCrossed,
  Waypoints,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  add: Plus,
  "arrow-right": ArrowRight,
  auto_awesome: Sparkles,
  book: BookOpen,
  camera: Camera,
  clapperboard: Clapperboard,
  film: Film,
  folder: Folder,
  gamepad: Gamepad2,
  history: History,
  hub: Waypoints,
  music: Music4,
  pending_actions: History,
  read_more: ArrowRight,
  settings: Settings,
  sparkles: Sparkles,
  tv: Tv,
  "utensils-crossed": UtensilsCrossed,
  waypoints: Waypoints,
};

export const categoryIconOptions = [
  "folder",
  "sparkles",
  "film",
  "tv",
  "clapperboard",
  "book",
  "music",
  "gamepad",
  "camera",
  "utensils-crossed",
] as const;

function normalizeIconName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export function AppIcon({
  name,
  className,
  strokeWidth = 2.2,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = iconMap[normalizeIconName(name)] ?? CircleHelp;

  return <Icon aria-hidden className={cn("shrink-0", className)} strokeWidth={strokeWidth} />;
}
