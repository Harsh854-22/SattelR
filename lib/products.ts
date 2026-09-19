import type { Product } from "./types";

/** OPEN_MART catalog from Ecommerce for agents.html + demo policy merchants */
export const PRODUCTS: Product[] = [
  { id: "p01", name: "USB-C Cable 2m", category: "electronics", priceUsd: 3.99, rating: 4.6, reviews: 1204, condition: "new", merchant: "trusted-gadgets.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p02", name: "GaN Charger 65W", category: "electronics", priceUsd: 18.5, rating: 4.8, reviews: 862, condition: "new", merchant: "trusted-gadgets.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p03", name: "Mech Keycap Set", category: "electronics", priceUsd: 24.0, rating: 4.5, reviews: 411, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p04", name: "Webcam 1080p", category: "electronics", priceUsd: 32.99, rating: 4.3, reviews: 289, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p05", name: "BT Speaker Mini", category: "electronics", priceUsd: 27.5, rating: 4.7, reviews: 933, condition: "new", merchant: "trusted-gadgets.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p06", name: "Portable SSD 1TB", category: "electronics", priceUsd: 89.0, rating: 4.9, reviews: 1520, condition: "new", merchant: "trusted-gadgets.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p07", name: "Ceramic Mug", category: "home", priceUsd: 9.25, rating: 4.4, reviews: 356, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p08", name: "Desk Lamp Mono", category: "home", priceUsd: 21.0, rating: 4.6, reviews: 502, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p09", name: "Throw Blanket", category: "home", priceUsd: 34.5, rating: 4.7, reviews: 644, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p10", name: "Plant Pot Set", category: "home", priceUsd: 7.8, rating: 4.2, reviews: 198, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p11", name: "Candle Trio", category: "home", priceUsd: 15.4, rating: 4.5, reviews: 421, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p12", name: "Heavy Cotton Tee", category: "apparel", priceUsd: 12.0, rating: 4.6, reviews: 1102, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p13", name: "Wool Beanie", category: "apparel", priceUsd: 14.75, rating: 4.4, reviews: 377, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p14", name: "Canvas Tote", category: "apparel", priceUsd: 8.5, rating: 4.3, reviews: 265, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p15", name: "Crew Socks 3pk", category: "apparel", priceUsd: 6.99, rating: 4.5, reviews: 812, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p16", name: "Rain Shell Pro", category: "apparel", priceUsd: 129.0, rating: 4.8, reviews: 240, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p17", name: "Phone Stand Alu", category: "electronics", priceUsd: 4.49, rating: 4.8, reviews: 860, condition: "new", merchant: "trusted-gadgets.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p18", name: 'Laptop Sleeve 14"', category: "accessories", priceUsd: 19.99, rating: 4.5, reviews: 433, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p19", name: "Multitool Keychain", category: "accessories", priceUsd: 11.25, rating: 4.4, reviews: 310, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p20", name: "Sticker Pack 20", category: "accessories", priceUsd: 2.5, rating: 4.7, reviews: 1490, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p21", name: "Watch Strap", category: "accessories", priceUsd: 13.9, rating: 4.3, reviews: 222, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p22", name: "Cable Organizer", category: "accessories", priceUsd: 5.6, rating: 4.6, reviews: 588, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p23", name: "Notebook A5", category: "accessories", priceUsd: 6.4, rating: 4.5, reviews: 704, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "p24", name: "Pen Set Black", category: "accessories", priceUsd: 8.9, rating: 4.4, reviews: 351, condition: "new", merchant: "mockshop.example", trusted: true, delivery: ["online", "cod"] },
  { id: "prod_3", name: "Used Earbuds", category: "electronics", priceUsd: 4.99, rating: 4.1, reviews: 95, condition: "used", merchant: "random-seller.example", trusted: false, delivery: ["cod"] },
  { id: "prod_4", name: "Premium Domain Credit", category: "domains", priceUsd: 5.0, rating: 4.9, reviews: 300, condition: "digital", merchant: "mock-domains.example", trusted: true, delivery: ["online"] },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function categoryLabel(cat: string): string {
  return cat.toUpperCase();
}
