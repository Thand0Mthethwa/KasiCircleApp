import { BusinessCard as MarketplaceBusinessCard } from "./MarketplaceCards";
// Adapted from KasiCircle-Demo/src/showcase/shared.jsx (Apache-2.0).
import {
  Utensils,
  Scissors,
  Wrench,
  Hammer,
  Laptop,
  ShoppingBag,
  HeartPulse,
  Briefcase,
  Sprout,
  LayoutGrid,
} from "lucide-react";

export const categories = [
  { value: "", label: "All businesses", icon: LayoutGrid },
  { value: "Food & Beverage", label: "Food & drink", icon: Utensils },
  { value: "Salon & Beauty", label: "Hair & beauty", icon: Scissors },
  { value: "Retail", label: "Shops & essentials", icon: ShoppingBag },
  { value: "Automotive", label: "Automotive", icon: Wrench },
  {
    value: "Construction & Hardware",
    label: "Hardware & building",
    icon: Hammer,
  },
  {
    value: "Technology & Electronics",
    label: "Tech & electronics",
    icon: Laptop,
  },
  { value: "Health & Wellness", label: "Health & wellness", icon: HeartPulse },
  {
    value: "Professional Services",
    label: "Professional services",
    icon: Briefcase,
  },
  { value: "Other", label: "Other services", icon: Sprout },
];

export const businessName = (business) => business.name;
export const categoryName = (value) =>
  categories.find((category) => category.value === value)?.label || value;
export const artworkFor = (business) => business.coverImageUrl;

export function BusinessCard({ business }) {
  return <MarketplaceBusinessCard business={business} />;
}
