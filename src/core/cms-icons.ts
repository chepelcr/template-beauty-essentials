// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * The icons a store's CMS may name (benefits, values, theme icons). A fixed
 * set, statically imported, so templates ship ~15 KB of icons instead of the
 * whole library or one file per icon. A name outside this set renders the
 * template's own fallback. Listed in docs/storefront/STOREFRONT_CONTENT_CONTRACT.md.
 */
import {
  Activity, Apple, Award, Baby, BadgeCheck, BadgePercent, Banana, Banknote,
  Bath, Bean, Bed, Beer, Bike, Bird, Bolt, Bone,
  Book, BookOpen, Brush, CakeSlice, Calendar, CalendarClock, Camera, Car,
  Carrot, Cat, ChefHat, Cherry, Citrus, ClipboardCheck, Clock, Clock3,
  Coffee, Cog, Cookie, Cpu, CreditCard, Croissant, Dog, Drill,
  Droplet, Drumstick, Dumbbell, Egg, Feather, Fish, Flame, Flower2,
  Gauge, Gem, Gift, Glasses, Globe, GraduationCap, Grape, Hammer,
  Hand, Headphones, Heart, HeartHandshake, HeartPulse, Hourglass, House, IceCreamCone,
  KeyRound, Lamp, Laptop, Leaf, Lightbulb, Lock, Mail, MapPin,
  MapPinned, Martini, MessageCircle, Milk, Mountain, Music, Navigation, Nut,
  Package, PackageCheck, PaintBucket, PaintRoller, Palette, PawPrint, Pencil, Percent,
  Phone, Pizza, Plug, Printer, Recycle, Ruler, Salad, Sandwich,
  Scale, Scissors, Search, Settings, Shell, Shield, ShieldCheck, Shirt,
  ShoppingBag, ShoppingBasket, Smartphone, Smile, Snowflake, Sofa, Soup, Sparkles,
  Sprout, Star, Stethoscope, Store, Sun, Tag, ThumbsUp, Ticket,
  Timer, TreePine, Trees, Truck, Users, UtensilsCrossed, Wallet, Watch,
  Waves, Wheat, Wine, Wrench, Zap,
  type LucideIcon,
} from 'lucide-react';
import { lucideName } from './cms';

export const CMS_ICONS: Readonly<Record<string, LucideIcon>> = {
  Activity, Apple, Award, Baby, BadgeCheck, BadgePercent, Banana, Banknote,
  Bath, Bean, Bed, Beer, Bike, Bird, Bolt, Bone,
  Book, BookOpen, Brush, CakeSlice, Calendar, CalendarClock, Camera, Car,
  Carrot, Cat, ChefHat, Cherry, Citrus, ClipboardCheck, Clock, Clock3,
  Coffee, Cog, Cookie, Cpu, CreditCard, Croissant, Dog, Drill,
  Droplet, Drumstick, Dumbbell, Egg, Feather, Fish, Flame, Flower2,
  Gauge, Gem, Gift, Glasses, Globe, GraduationCap, Grape, Hammer,
  Hand, Headphones, Heart, HeartHandshake, HeartPulse, Hourglass, House, IceCreamCone,
  KeyRound, Lamp, Laptop, Leaf, Lightbulb, Lock, Mail, MapPin,
  MapPinned, Martini, MessageCircle, Milk, Mountain, Music, Navigation, Nut,
  Package, PackageCheck, PaintBucket, PaintRoller, Palette, PawPrint, Pencil, Percent,
  Phone, Pizza, Plug, Printer, Recycle, Ruler, Salad, Sandwich,
  Scale, Scissors, Search, Settings, Shell, Shield, ShieldCheck, Shirt,
  ShoppingBag, ShoppingBasket, Smartphone, Smile, Snowflake, Sofa, Soup, Sparkles,
  Sprout, Star, Stethoscope, Store, Sun, Tag, ThumbsUp, Ticket,
  Timer, TreePine, Trees, Truck, Users, UtensilsCrossed, Wallet, Watch,
  Waves, Wheat, Wine, Wrench, Zap,
};

const byKebab = new Map(Object.entries(CMS_ICONS).map(([name, icon]) => [lucideName(name)!, icon]));

/** The icon a CMS value names ("MessageCircle" or "message-circle"), or null. */
export function cmsIcon(name: string | null | undefined): LucideIcon | null {
  if (!name) return null;
  return CMS_ICONS[name.trim()] ?? byKebab.get(lucideName(name) ?? '') ?? null;
}
