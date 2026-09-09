export type Business = {
  id: string;
  name: string;
  category: string;
  description: string;
  area: string;
  hours: string;
  rating: string;
  tags: string[];
  accent: string;
  verified?: boolean;
  featured?: boolean;
};

// Mock listings keep the first UI test independent from Supabase credentials.
export const businesses: Business[] = [
  { id: "terminus-mobile-hub", name: "Terminus Mobile Hub", category: "Phones & Tech", description: "Phones, accessories and honest device advice.", area: "Ahmadu Bello Way", hours: "Open until 7:00 PM", rating: "4.8", tags: ["iphone", "android", "accessories", "phone"], accent: "coral", verified: true, featured: true },
  { id: "plateau-laptop-clinic", name: "Plateau Laptop Clinic", category: "Phones & Tech", description: "Laptop repairs, upgrades and reliable diagnostics.", area: "Terminus Roundabout", hours: "Open until 6:00 PM", rating: "4.7", tags: ["laptop", "repair", "computer", "macbook"], accent: "blue", verified: true },
  { id: "highland-grills", name: "Highland Grills", category: "Food & Dining", description: "Smoky grills, jollof and quick bites made fresh.", area: "Terminus Market", hours: "Open until 10:00 PM", rating: "4.6", tags: ["suya", "food", "jollof", "restaurant"], accent: "yellow", featured: true },
  { id: "cityprint-jos", name: "CityPrint Jos", category: "Services", description: "Fast printing, branding and graphic design.", area: "Ahmadu Bello Way", hours: "Open until 5:30 PM", rating: "4.5", tags: ["printing", "design", "branding", "services"], accent: "green" },
  { id: "northline-fitness", name: "Northline Fitness", category: "Health & Fitness", description: "A focused gym for strength, movement and community.", area: "Terminus", hours: "Open until 9:00 PM", rating: "4.4", tags: ["gym", "fitness", "health", "workout"], accent: "purple" },
  { id: "jos-home-studio", name: "Jos Home Studio", category: "Home & Living", description: "Thoughtful furniture and decor for modern homes.", area: "Terminus Market", hours: "Open until 6:00 PM", rating: "4.3", tags: ["furniture", "home", "decor", "chairs"], accent: "orange" },
];

export const categories = [
  { name: "All", icon: "✦" },
  { name: "Food & Dining", icon: "◒" },
  { name: "Phones & Tech", icon: "▣" },
  { name: "Services", icon: "◈" },
  { name: "Home & Living", icon: "⌂" },
];
