// Editor's picks — curated fallback outfits for every genre × occasion
// Used as tier 3 fallback when both Gemini and Redis cache are unavailable
// Each genre has 4 outfits across different occasions so the user always sees content
// Items reference real brands/prices from the seed catalog

import type { Outfit, OutfitItem } from "@/types/outfit";
import { nanoid } from "nanoid";

interface EditorOutfit {
  items: Omit<OutfitItem, "itemId">[];
  occasion: string;
  weather?: string;
  styleExplanation: string;
}

// ─── OLD MONEY ───────────────────────────────────────
const OLD_MONEY: EditorOutfit[] = [
  {
    occasion: "casual",
    weather: "warm",
    styleExplanation: "The effortless weekend look — a polo tucked into slim chinos, penny loafers, and a leather belt. Quiet luxury that doesn't try too hard.",
    items: [
      { itemType: "catalog", position: "top", name: "Slim Fit Mesh Polo", brand: "Ralph Lauren", price: 125, imageUrl: "", affiliateUrl: "", color: "navy" },
      { itemType: "catalog", position: "bottom", name: "Slim Chinos", brand: "Ralph Lauren", price: 98, imageUrl: "", affiliateUrl: "", color: "beige" },
      { itemType: "catalog", position: "shoes", name: "Penny Loafers", brand: "G.H. Bass", price: 135, imageUrl: "", affiliateUrl: "", color: "brown" },
      { itemType: "catalog", position: "accessory", name: "Leather Belt", brand: "Anderson's", price: 95, imageUrl: "", affiliateUrl: "", color: "brown" },
    ],
  },
  {
    occasion: "formal",
    weather: "cool",
    styleExplanation: "The boardroom-to-dinner look. Tailored wool trousers with a cashmere sweater layered over an oxford — polished without being stuffy.",
    items: [
      { itemType: "catalog", position: "top", name: "Cashmere V-Neck Sweater", brand: "Loro Piana", price: 1250, imageUrl: "", affiliateUrl: "", color: "camel" },
      { itemType: "catalog", position: "bottom", name: "Tailored Wool Trousers", brand: "Theory", price: 295, imageUrl: "", affiliateUrl: "", color: "charcoal" },
      { itemType: "catalog", position: "shoes", name: "Oxford Dress Shoes", brand: "Allen Edmonds", price: 295, imageUrl: "", affiliateUrl: "", color: "brown" },
      { itemType: "catalog", position: "outerwear", name: "Wool Overcoat", brand: "Reiss", price: 475, imageUrl: "", affiliateUrl: "", color: "camel" },
      { itemType: "catalog", position: "accessory", name: "Silk Pocket Square", brand: "Drake's", price: 75, imageUrl: "", affiliateUrl: "", color: "burgundy" },
    ],
  },
  {
    occasion: "date",
    weather: "warm",
    styleExplanation: "Date night old money — silk button-down with the top button undone, tailored trousers, suede loafers. Confident and understated.",
    items: [
      { itemType: "catalog", position: "top", name: "Silk Button-Down Blouse", brand: "Theory", price: 275, imageUrl: "", affiliateUrl: "", color: "ivory" },
      { itemType: "catalog", position: "bottom", name: "Pleated Dress Pants", brand: "Brooks Brothers", price: 168, imageUrl: "", affiliateUrl: "", color: "grey" },
      { itemType: "catalog", position: "shoes", name: "Suede Loafers", brand: "Tod's", price: 625, imageUrl: "", affiliateUrl: "", color: "navy" },
      { itemType: "catalog", position: "accessory", name: "Minimalist Watch", brand: "Cartier", price: 4950, imageUrl: "", affiliateUrl: "", color: "gold" },
    ],
  },
  {
    occasion: "work",
    styleExplanation: "Classic office elegance. Oxford shirt under a merino crewneck, straight-leg chinos, and clean leather shoes. Professional without the suit.",
    items: [
      { itemType: "catalog", position: "top", name: "Classic Oxford Shirt", brand: "Brooks Brothers", price: 98, imageUrl: "", affiliateUrl: "", color: "white" },
      { itemType: "catalog", position: "bottom", name: "Straight Leg Chinos", brand: "COS", price: 69, imageUrl: "", affiliateUrl: "", color: "navy" },
      { itemType: "catalog", position: "shoes", name: "Leather Boat Shoes", brand: "Sperry", price: 98, imageUrl: "", affiliateUrl: "", color: "tan" },
      { itemType: "catalog", position: "outerwear", name: "Merino Wool Crewneck", brand: "COS", price: 89, imageUrl: "", affiliateUrl: "", color: "cream" },
    ],
  },
];

// ─── STREETWEAR ──────────────────────────────────────
const STREETWEAR: EditorOutfit[] = [
  {
    occasion: "casual",
    styleExplanation: "The clean streetwear staple — oversized graphic tee, cargo pants, Air Force 1s. Add a crossbody bag and you're set.",
    items: [
      { itemType: "catalog", position: "top", name: "Oversized Graphic Tee", brand: "Stussy", price: 55, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "bottom", name: "Cargo Pants", brand: "Nike ACG", price: 130, imageUrl: "", affiliateUrl: "", color: "olive" },
      { itemType: "catalog", position: "shoes", name: "Air Force 1 '07", brand: "Nike", price: 115, imageUrl: "", affiliateUrl: "", color: "white" },
      { itemType: "catalog", position: "bag", name: "Crossbody Bag", brand: "Carhartt WIP", price: 55, imageUrl: "", affiliateUrl: "", color: "black" },
    ],
  },
  {
    occasion: "party",
    styleExplanation: "Party streetwear that pops. Tech fleece joggers, statement hoodie, and Dunks. The chain necklace ties it together.",
    items: [
      { itemType: "catalog", position: "top", name: "Embroidered Hoodie", brand: "Supreme", price: 168, imageUrl: "", affiliateUrl: "", color: "red" },
      { itemType: "catalog", position: "bottom", name: "Tech Fleece Joggers", brand: "Nike", price: 110, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "shoes", name: "Dunk Low Retro", brand: "Nike", price: 115, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "accessory", name: "Cuban Link Chain", brand: "Vitaly", price: 89, imageUrl: "", affiliateUrl: "", color: "silver" },
    ],
  },
  {
    occasion: "casual",
    weather: "cool",
    styleExplanation: "Layered fall streetwear — vintage band tee under an oversized flannel, baggy jeans, New Balance 550s. Effortlessly cool.",
    items: [
      { itemType: "catalog", position: "top", name: "Vintage Band Tee", brand: "Thrift", price: 35, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "bottom", name: "Baggy Jeans", brand: "Levi's", price: 89, imageUrl: "", affiliateUrl: "", color: "indigo" },
      { itemType: "catalog", position: "shoes", name: "550 Retro", brand: "New Balance", price: 110, imageUrl: "", affiliateUrl: "", color: "white" },
      { itemType: "catalog", position: "outerwear", name: "Oversized Flannel Shirt", brand: "Stussy", price: 125, imageUrl: "", affiliateUrl: "", color: "red" },
    ],
  },
  {
    occasion: "work",
    styleExplanation: "Office-appropriate streetwear. Clean hoodie under a structured jacket, tapered pants, and premium sneakers. Casual Friday done right.",
    items: [
      { itemType: "catalog", position: "top", name: "Minimal Hoodie", brand: "Reigning Champ", price: 135, imageUrl: "", affiliateUrl: "", color: "heather_grey" },
      { itemType: "catalog", position: "bottom", name: "Tapered Tech Pants", brand: "Adidas", price: 85, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "shoes", name: "Ultraboost", brand: "Adidas", price: 190, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "outerwear", name: "Coach Jacket", brand: "Carhartt WIP", price: 148, imageUrl: "", affiliateUrl: "", color: "navy" },
    ],
  },
];

// ─── MINIMALIST ──────────────────────────────────────
const MINIMALIST: EditorOutfit[] = [
  {
    occasion: "casual",
    styleExplanation: "Peak minimalism — oversized structured tee, wide-leg trousers, clean white sneakers. Zero noise, maximum impact.",
    items: [
      { itemType: "catalog", position: "top", name: "Boxy Fit T-Shirt", brand: "COS", price: 35, imageUrl: "", affiliateUrl: "", color: "white" },
      { itemType: "catalog", position: "bottom", name: "Wide-Leg Trousers", brand: "Arket", price: 89, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "shoes", name: "Achilles Low", brand: "Common Projects", price: 425, imageUrl: "", affiliateUrl: "", color: "white" },
      { itemType: "catalog", position: "accessory", name: "Leather Card Holder", brand: "Acne Studios", price: 120, imageUrl: "", affiliateUrl: "", color: "black" },
    ],
  },
  {
    occasion: "work",
    styleExplanation: "Minimalist workwear that commands attention through cut, not color. Structured blazer, turtleneck, tapered trousers. Monochrome power.",
    items: [
      { itemType: "catalog", position: "top", name: "Merino Turtleneck", brand: "Uniqlo", price: 49, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "bottom", name: "Tailored Trousers", brand: "COS", price: 99, imageUrl: "", affiliateUrl: "", color: "charcoal" },
      { itemType: "catalog", position: "shoes", name: "Chelsea Boots", brand: "R.M. Williams", price: 495, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "outerwear", name: "Unlined Wool Blazer", brand: "Arket", price: 189, imageUrl: "", affiliateUrl: "", color: "charcoal" },
    ],
  },
  {
    occasion: "date",
    styleExplanation: "Minimalist date look — a perfectly fitted knit, clean trousers, and leather boots. Let the silhouette speak. No logos, no fuss.",
    items: [
      { itemType: "catalog", position: "top", name: "Fine Gauge Knit", brand: "& Other Stories", price: 69, imageUrl: "", affiliateUrl: "", color: "cream" },
      { itemType: "catalog", position: "bottom", name: "Pleated Trousers", brand: "COS", price: 89, imageUrl: "", affiliateUrl: "", color: "navy" },
      { itemType: "catalog", position: "shoes", name: "Leather Ankle Boots", brand: "Acne Studios", price: 550, imageUrl: "", affiliateUrl: "", color: "black" },
    ],
  },
  {
    occasion: "casual",
    weather: "cold",
    styleExplanation: "Winter minimalism. Structured overcoat over a cashmere knit and straight-leg jeans. Neutral palette, premium textures.",
    items: [
      { itemType: "catalog", position: "top", name: "Cashmere Crewneck", brand: "Everlane", price: 130, imageUrl: "", affiliateUrl: "", color: "grey" },
      { itemType: "catalog", position: "bottom", name: "Straight Leg Jeans", brand: "A.P.C.", price: 210, imageUrl: "", affiliateUrl: "", color: "indigo" },
      { itemType: "catalog", position: "shoes", name: "Suede Desert Boots", brand: "Clarks", price: 120, imageUrl: "", affiliateUrl: "", color: "sand" },
      { itemType: "catalog", position: "outerwear", name: "Wool Overcoat", brand: "COS", price: 290, imageUrl: "", affiliateUrl: "", color: "camel" },
    ],
  },
];

// ─── Y2K ─────────────────────────────────────────────
const Y2K: EditorOutfit[] = [
  {
    occasion: "party",
    styleExplanation: "Full Y2K glam — butterfly crop top, low-rise mini skirt, platform sneakers, chunky hoops. Bold, sparkly, unapologetic.",
    items: [
      { itemType: "catalog", position: "top", name: "Butterfly Print Crop Top", brand: "Dolls Kill", price: 38, imageUrl: "", affiliateUrl: "", color: "pink" },
      { itemType: "catalog", position: "bottom", name: "Low-Rise Mini Skirt", brand: "SHEIN", price: 18, imageUrl: "", affiliateUrl: "", color: "silver" },
      { itemType: "catalog", position: "shoes", name: "Platform Sneakers", brand: "Buffalo London", price: 150, imageUrl: "", affiliateUrl: "", color: "white" },
      { itemType: "catalog", position: "accessory", name: "Chunky Hoop Earrings", brand: "Juicy Couture", price: 32, imageUrl: "", affiliateUrl: "", color: "gold" },
    ],
  },
  {
    occasion: "casual",
    styleExplanation: "Everyday Y2K — baby tee, low-rise cargo pants, chunky sneakers, and a mini bag. The 2000s called and they want you to slay.",
    items: [
      { itemType: "catalog", position: "top", name: "Baby Tee", brand: "PacSun", price: 24, imageUrl: "", affiliateUrl: "", color: "baby_blue" },
      { itemType: "catalog", position: "bottom", name: "Low-Rise Cargo Pants", brand: "Dolls Kill", price: 58, imageUrl: "", affiliateUrl: "", color: "khaki" },
      { itemType: "catalog", position: "shoes", name: "Chunky Trainers", brand: "Fila", price: 85, imageUrl: "", affiliateUrl: "", color: "white" },
      { itemType: "catalog", position: "bag", name: "Mini Baguette Bag", brand: "Fendi", price: 1290, imageUrl: "", affiliateUrl: "", color: "pink" },
    ],
  },
  {
    occasion: "date",
    styleExplanation: "Y2K date night — velour zip-up over a sparkly cami, denim mini, and kitten heels. Paris Hilton energy.",
    items: [
      { itemType: "catalog", position: "top", name: "Rhinestone Cami Top", brand: "SHEIN", price: 15, imageUrl: "", affiliateUrl: "", color: "silver" },
      { itemType: "catalog", position: "bottom", name: "Denim Mini Skirt", brand: "PacSun", price: 42, imageUrl: "", affiliateUrl: "", color: "light_blue" },
      { itemType: "catalog", position: "shoes", name: "Kitten Heel Mules", brand: "Steve Madden", price: 89, imageUrl: "", affiliateUrl: "", color: "clear" },
      { itemType: "catalog", position: "outerwear", name: "Velour Zip Hoodie", brand: "Juicy Couture", price: 98, imageUrl: "", affiliateUrl: "", color: "hot_pink" },
    ],
  },
  {
    occasion: "casual",
    weather: "cool",
    styleExplanation: "Cozy Y2K — bedazzled hoodie, flared jeans, platform UGGs, tinted sunglasses. Nostalgic comfort meets main character energy.",
    items: [
      { itemType: "catalog", position: "top", name: "Bedazzled Hoodie", brand: "Ed Hardy", price: 78, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "bottom", name: "Low-Rise Flare Jeans", brand: "True Religion", price: 120, imageUrl: "", affiliateUrl: "", color: "medium_wash" },
      { itemType: "catalog", position: "shoes", name: "Platform Mini Boots", brand: "UGG", price: 160, imageUrl: "", affiliateUrl: "", color: "chestnut" },
      { itemType: "catalog", position: "accessory", name: "Tinted Sunglasses", brand: "Quay", price: 55, imageUrl: "", affiliateUrl: "", color: "rose" },
    ],
  },
];

// ─── DARK ACADEMIA ───────────────────────────────────
const DARK_ACADEMIA: EditorOutfit[] = [
  {
    occasion: "casual",
    weather: "cool",
    styleExplanation: "Library aesthetic — tweed blazer over a turtleneck, corduroy pants, Oxford shoes. Like you just walked out of a Cambridge lecture hall.",
    items: [
      { itemType: "catalog", position: "top", name: "Fine Gauge Turtleneck", brand: "Uniqlo", price: 39, imageUrl: "", affiliateUrl: "", color: "brown" },
      { itemType: "catalog", position: "bottom", name: "Corduroy Pants", brand: "J.Crew", price: 89, imageUrl: "", affiliateUrl: "", color: "tan" },
      { itemType: "catalog", position: "shoes", name: "Leather Oxford Shoes", brand: "Dr. Martens", price: 150, imageUrl: "", affiliateUrl: "", color: "cherry_red" },
      { itemType: "catalog", position: "outerwear", name: "Tweed Blazer", brand: "Harris Tweed", price: 285, imageUrl: "", affiliateUrl: "", color: "brown" },
    ],
  },
  {
    occasion: "work",
    styleExplanation: "Academic workwear — knit vest over a button-down, wool trousers, brogues. The professor who actually has taste.",
    items: [
      { itemType: "catalog", position: "top", name: "Oxford Button-Down", brand: "Brooks Brothers", price: 98, imageUrl: "", affiliateUrl: "", color: "ecru" },
      { itemType: "catalog", position: "bottom", name: "Wool Flannel Trousers", brand: "Spier & Mackay", price: 148, imageUrl: "", affiliateUrl: "", color: "charcoal" },
      { itemType: "catalog", position: "shoes", name: "Wingtip Brogues", brand: "Grenson", price: 340, imageUrl: "", affiliateUrl: "", color: "tan" },
      { itemType: "catalog", position: "outerwear", name: "Argyle Knit Vest", brand: "Ralph Lauren", price: 128, imageUrl: "", affiliateUrl: "", color: "burgundy" },
    ],
  },
  {
    occasion: "date",
    styleExplanation: "Romantic dark academia — cashmere sweater, pleated skirt, ankle boots, vintage-style watch. Bookish charm meets sophistication.",
    items: [
      { itemType: "catalog", position: "top", name: "Cable Knit Sweater", brand: "Sezane", price: 165, imageUrl: "", affiliateUrl: "", color: "forest_green" },
      { itemType: "catalog", position: "bottom", name: "Pleated Midi Skirt", brand: "& Other Stories", price: 79, imageUrl: "", affiliateUrl: "", color: "brown" },
      { itemType: "catalog", position: "shoes", name: "Leather Ankle Boots", brand: "Vagabond", price: 170, imageUrl: "", affiliateUrl: "", color: "cognac" },
      { itemType: "catalog", position: "accessory", name: "Leather Watch", brand: "Daniel Wellington", price: 179, imageUrl: "", affiliateUrl: "", color: "brown" },
    ],
  },
  {
    occasion: "casual",
    styleExplanation: "Cozy dark academia — oversized cardigan, high-waisted trousers, loafers. Wrapped in literature and warmth.",
    items: [
      { itemType: "catalog", position: "top", name: "Oversized Cardigan", brand: "Cos", price: 120, imageUrl: "", affiliateUrl: "", color: "oatmeal" },
      { itemType: "catalog", position: "bottom", name: "High-Waisted Trousers", brand: "Massimo Dutti", price: 89, imageUrl: "", affiliateUrl: "", color: "olive" },
      { itemType: "catalog", position: "shoes", name: "Tassel Loafers", brand: "G.H. Bass", price: 135, imageUrl: "", affiliateUrl: "", color: "brown" },
      { itemType: "catalog", position: "accessory", name: "Wool Scarf", brand: "Barbour", price: 65, imageUrl: "", affiliateUrl: "", color: "tartan" },
    ],
  },
];

// ─── COTTAGECORE ──────────────────────────────────────
const COTTAGECORE: EditorOutfit[] = [
  {
    occasion: "casual",
    styleExplanation: "Meadow-ready. Floral midi dress, woven basket bag, leather sandals. You look like you bake sourdough and pick wildflowers.",
    items: [
      { itemType: "catalog", position: "top", name: "Floral Midi Dress", brand: "Reformation", price: 278, imageUrl: "", affiliateUrl: "", color: "cream" },
      { itemType: "catalog", position: "shoes", name: "Leather Sandals", brand: "Birkenstock", price: 110, imageUrl: "", affiliateUrl: "", color: "tan" },
      { itemType: "catalog", position: "bag", name: "Woven Basket Bag", brand: "Loewe", price: 590, imageUrl: "", affiliateUrl: "", color: "natural" },
      { itemType: "catalog", position: "accessory", name: "Straw Sun Hat", brand: "Lack of Color", price: 89, imageUrl: "", affiliateUrl: "", color: "natural" },
    ],
  },
  {
    occasion: "date",
    styleExplanation: "Romantic cottagecore — puff sleeve blouse, tiered skirt, Mary Janes. Like a Bridgerton garden party but make it modern.",
    items: [
      { itemType: "catalog", position: "top", name: "Puff Sleeve Blouse", brand: "Doen", price: 228, imageUrl: "", affiliateUrl: "", color: "white" },
      { itemType: "catalog", position: "bottom", name: "Tiered Midi Skirt", brand: "Free People", price: 108, imageUrl: "", affiliateUrl: "", color: "sage" },
      { itemType: "catalog", position: "shoes", name: "Leather Mary Janes", brand: "Dr. Martens", price: 130, imageUrl: "", affiliateUrl: "", color: "cherry_red" },
    ],
  },
  {
    occasion: "casual",
    weather: "cool",
    styleExplanation: "Autumn cottage — oversized knit cardigan, linen pants, clogs. Cozy enough for a fireside reading session.",
    items: [
      { itemType: "catalog", position: "top", name: "Chunky Knit Cardigan", brand: "Free People", price: 148, imageUrl: "", affiliateUrl: "", color: "oatmeal" },
      { itemType: "catalog", position: "bottom", name: "Linen Wide-Leg Pants", brand: "& Other Stories", price: 79, imageUrl: "", affiliateUrl: "", color: "cream" },
      { itemType: "catalog", position: "shoes", name: "Leather Clogs", brand: "Swedish Hasbeens", price: 200, imageUrl: "", affiliateUrl: "", color: "cognac" },
      { itemType: "catalog", position: "accessory", name: "Pearl Earrings", brand: "Mejuri", price: 58, imageUrl: "", affiliateUrl: "", color: "gold" },
    ],
  },
  {
    occasion: "party",
    styleExplanation: "Cottagecore party — embroidered maxi dress, delicate jewelry, ballet flats. Garden party fairy energy.",
    items: [
      { itemType: "catalog", position: "top", name: "Embroidered Maxi Dress", brand: "Doen", price: 348, imageUrl: "", affiliateUrl: "", color: "dusty_rose" },
      { itemType: "catalog", position: "shoes", name: "Satin Ballet Flats", brand: "Repetto", price: 295, imageUrl: "", affiliateUrl: "", color: "blush" },
      { itemType: "catalog", position: "accessory", name: "Delicate Gold Necklace", brand: "Mejuri", price: 68, imageUrl: "", affiliateUrl: "", color: "gold" },
    ],
  },
];

// ─── GRUNGE ──────────────────────────────────────────
const GRUNGE: EditorOutfit[] = [
  {
    occasion: "casual",
    styleExplanation: "Classic grunge — oversized flannel over a band tee, ripped jeans, combat boots. Kurt Cobain approved.",
    items: [
      { itemType: "catalog", position: "top", name: "Nirvana Graphic Tee", brand: "Urban Outfitters", price: 39, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "bottom", name: "Distressed Slim Jeans", brand: "Levi's", price: 98, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "shoes", name: "1460 Boots", brand: "Dr. Martens", price: 170, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "outerwear", name: "Oversized Flannel", brand: "Carhartt", price: 69, imageUrl: "", affiliateUrl: "", color: "red" },
    ],
  },
  {
    occasion: "party",
    styleExplanation: "Grunge night out — leather jacket, mesh top, black skinnies, platform boots. Dark, edgy, mosh pit ready.",
    items: [
      { itemType: "catalog", position: "top", name: "Mesh Long Sleeve", brand: "AllSaints", price: 68, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "bottom", name: "Coated Skinny Jeans", brand: "AllSaints", price: 178, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "shoes", name: "Platform Chelsea Boots", brand: "Dr. Martens", price: 200, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "outerwear", name: "Leather Biker Jacket", brand: "Schott NYC", price: 800, imageUrl: "", affiliateUrl: "", color: "black" },
    ],
  },
  {
    occasion: "casual",
    weather: "warm",
    styleExplanation: "Summer grunge — cropped band tee, cutoff shorts, canvas sneakers. Keep the attitude, lose the layers.",
    items: [
      { itemType: "catalog", position: "top", name: "Cropped Band Tee", brand: "Hot Topic", price: 24, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "bottom", name: "Distressed Cutoff Shorts", brand: "Levi's", price: 59, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "shoes", name: "Chuck Taylor High Top", brand: "Converse", price: 65, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "accessory", name: "Studded Belt", brand: "AllSaints", price: 85, imageUrl: "", affiliateUrl: "", color: "black" },
    ],
  },
  {
    occasion: "date",
    styleExplanation: "Soft grunge date — oversized knit, leather pants, boots. Brooding but approachable. You probably have great taste in music.",
    items: [
      { itemType: "catalog", position: "top", name: "Distressed Knit Sweater", brand: "Acne Studios", price: 350, imageUrl: "", affiliateUrl: "", color: "grey" },
      { itemType: "catalog", position: "bottom", name: "Leather Straight Leg", brand: "AllSaints", price: 399, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "shoes", name: "Harness Boots", brand: "Frye", price: 298, imageUrl: "", affiliateUrl: "", color: "black" },
    ],
  },
];

// ─── COQUETTE ────────────────────────────────────────
const COQUETTE: EditorOutfit[] = [
  {
    occasion: "date",
    styleExplanation: "Full coquette — lace cami, satin midi skirt, kitten heels, pearl earrings. Soft, feminine, and flirty.",
    items: [
      { itemType: "catalog", position: "top", name: "Lace Trim Camisole", brand: "Reformation", price: 98, imageUrl: "", affiliateUrl: "", color: "blush" },
      { itemType: "catalog", position: "bottom", name: "Satin Midi Skirt", brand: "& Other Stories", price: 79, imageUrl: "", affiliateUrl: "", color: "champagne" },
      { itemType: "catalog", position: "shoes", name: "Kitten Heel Slingbacks", brand: "Sam Edelman", price: 130, imageUrl: "", affiliateUrl: "", color: "nude" },
      { itemType: "catalog", position: "accessory", name: "Pearl Drop Earrings", brand: "Mejuri", price: 78, imageUrl: "", affiliateUrl: "", color: "pearl" },
    ],
  },
  {
    occasion: "casual",
    styleExplanation: "Everyday coquette — bow-detail top, pleated mini, ballet flats. Sweet without trying. Add a ribbon headband for full commitment.",
    items: [
      { itemType: "catalog", position: "top", name: "Bow Detail Blouse", brand: "Sezane", price: 135, imageUrl: "", affiliateUrl: "", color: "white" },
      { itemType: "catalog", position: "bottom", name: "Pleated Mini Skirt", brand: "Maje", price: 195, imageUrl: "", affiliateUrl: "", color: "pink" },
      { itemType: "catalog", position: "shoes", name: "Satin Ballet Flats", brand: "Repetto", price: 295, imageUrl: "", affiliateUrl: "", color: "blush" },
      { itemType: "catalog", position: "accessory", name: "Satin Hair Bow", brand: "Lelet NY", price: 48, imageUrl: "", affiliateUrl: "", color: "pink" },
    ],
  },
  {
    occasion: "party",
    styleExplanation: "Party coquette — corset top, tulle skirt, strappy heels. Balletcore meets going out. You're the main character tonight.",
    items: [
      { itemType: "catalog", position: "top", name: "Lace Corset Top", brand: "For Love & Lemons", price: 158, imageUrl: "", affiliateUrl: "", color: "white" },
      { itemType: "catalog", position: "bottom", name: "Tulle Mini Skirt", brand: "Simone Rocha", price: 445, imageUrl: "", affiliateUrl: "", color: "pink" },
      { itemType: "catalog", position: "shoes", name: "Strappy Heeled Sandals", brand: "Stuart Weitzman", price: 395, imageUrl: "", affiliateUrl: "", color: "nude" },
    ],
  },
  {
    occasion: "work",
    styleExplanation: "Office coquette — Peter Pan collar blouse, A-line skirt, Mary Janes. Professional but distinctly feminine. HR-safe flirty.",
    items: [
      { itemType: "catalog", position: "top", name: "Peter Pan Collar Blouse", brand: "Sandro", price: 195, imageUrl: "", affiliateUrl: "", color: "cream" },
      { itemType: "catalog", position: "bottom", name: "A-Line Wool Skirt", brand: "Maje", price: 225, imageUrl: "", affiliateUrl: "", color: "blush" },
      { itemType: "catalog", position: "shoes", name: "Patent Mary Janes", brand: "Repetto", price: 345, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "accessory", name: "Velvet Headband", brand: "Jennifer Behr", price: 78, imageUrl: "", affiliateUrl: "", color: "black" },
    ],
  },
];

// ─── COASTAL GRANDMA ─────────────────────────────────
const COASTAL_GRANDMA: EditorOutfit[] = [
  {
    occasion: "casual",
    weather: "warm",
    styleExplanation: "Peak coastal grandma — linen shirt, wide-leg trousers, espadrilles, straw tote. You look like you own a house in the Hamptons.",
    items: [
      { itemType: "catalog", position: "top", name: "Oversized Linen Shirt", brand: "James Perse", price: 175, imageUrl: "", affiliateUrl: "", color: "white" },
      { itemType: "catalog", position: "bottom", name: "Wide-Leg Linen Pants", brand: "Eileen Fisher", price: 178, imageUrl: "", affiliateUrl: "", color: "sand" },
      { itemType: "catalog", position: "shoes", name: "Canvas Espadrilles", brand: "Soludos", price: 75, imageUrl: "", affiliateUrl: "", color: "natural" },
      { itemType: "catalog", position: "bag", name: "Straw Market Tote", brand: "Clare V.", price: 195, imageUrl: "", affiliateUrl: "", color: "natural" },
    ],
  },
  {
    occasion: "date",
    styleExplanation: "Seaside dinner date — knit tank, flowing palazzo pants, leather slides. Effortlessly elegant, windswept hair optional.",
    items: [
      { itemType: "catalog", position: "top", name: "Ribbed Knit Tank", brand: "Vince", price: 95, imageUrl: "", affiliateUrl: "", color: "ivory" },
      { itemType: "catalog", position: "bottom", name: "Palazzo Pants", brand: "Eileen Fisher", price: 198, imageUrl: "", affiliateUrl: "", color: "navy" },
      { itemType: "catalog", position: "shoes", name: "Leather Slide Sandals", brand: "Ancient Greek Sandals", price: 195, imageUrl: "", affiliateUrl: "", color: "tan" },
      { itemType: "catalog", position: "accessory", name: "Gold Cuff Bracelet", brand: "Monica Vinader", price: 150, imageUrl: "", affiliateUrl: "", color: "gold" },
    ],
  },
  {
    occasion: "casual",
    weather: "cool",
    styleExplanation: "Autumn coastal — chunky cable knit, khakis, loafers, canvas tote. Diane Keaton walking the beach in October.",
    items: [
      { itemType: "catalog", position: "top", name: "Cable Knit Fisherman Sweater", brand: "Aran Crafts", price: 98, imageUrl: "", affiliateUrl: "", color: "cream" },
      { itemType: "catalog", position: "bottom", name: "Relaxed Fit Khakis", brand: "J.Crew", price: 89, imageUrl: "", affiliateUrl: "", color: "khaki" },
      { itemType: "catalog", position: "shoes", name: "Leather Penny Loafers", brand: "G.H. Bass", price: 135, imageUrl: "", affiliateUrl: "", color: "brown" },
      { itemType: "catalog", position: "bag", name: "Canvas Tote", brand: "L.L. Bean", price: 39, imageUrl: "", affiliateUrl: "", color: "navy" },
    ],
  },
  {
    occasion: "work",
    styleExplanation: "Coastal office — striped Breton top, tailored chinos, clean sneakers. Nancy Meyers movie wardrobe meets business casual.",
    items: [
      { itemType: "catalog", position: "top", name: "Breton Stripe Top", brand: "Saint James", price: 95, imageUrl: "", affiliateUrl: "", color: "navy" },
      { itemType: "catalog", position: "bottom", name: "Cotton Chinos", brand: "J.Crew", price: 79, imageUrl: "", affiliateUrl: "", color: "stone" },
      { itemType: "catalog", position: "shoes", name: "White Canvas Sneakers", brand: "Veja", price: 120, imageUrl: "", affiliateUrl: "", color: "white" },
      { itemType: "catalog", position: "outerwear", name: "Cotton Blazer", brand: "Massimo Dutti", price: 169, imageUrl: "", affiliateUrl: "", color: "navy" },
    ],
  },
];

// ─── GORPCORE ────────────────────────────────────────
const GORPCORE: EditorOutfit[] = [
  {
    occasion: "casual",
    styleExplanation: "Trail-to-street gorpcore — technical fleece, hiking pants, trail runners, utility vest. Ready for a hike or a coffee run.",
    items: [
      { itemType: "catalog", position: "top", name: "Better Sweater Fleece", brand: "Patagonia", price: 139, imageUrl: "", affiliateUrl: "", color: "sage" },
      { itemType: "catalog", position: "bottom", name: "Convertible Hiking Pants", brand: "Arc'teryx", price: 199, imageUrl: "", affiliateUrl: "", color: "olive" },
      { itemType: "catalog", position: "shoes", name: "Moab Speed", brand: "Merrell", price: 120, imageUrl: "", affiliateUrl: "", color: "olive" },
      { itemType: "catalog", position: "accessory", name: "Beanie", brand: "The North Face", price: 28, imageUrl: "", affiliateUrl: "", color: "black" },
    ],
  },
  {
    occasion: "casual",
    weather: "cold",
    styleExplanation: "Winter gorpcore — puffer jacket, merino base layer, snow pants, hiking boots. Fashion-forward functionality at -10.",
    items: [
      { itemType: "catalog", position: "top", name: "Merino Base Layer", brand: "Icebreaker", price: 100, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "bottom", name: "Insulated Pants", brand: "Arc'teryx", price: 299, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "shoes", name: "Hiking Boots", brand: "Salomon", price: 180, imageUrl: "", affiliateUrl: "", color: "brown" },
      { itemType: "catalog", position: "outerwear", name: "700-Fill Down Puffer", brand: "The North Face", price: 279, imageUrl: "", affiliateUrl: "", color: "olive" },
    ],
  },
  {
    occasion: "party",
    styleExplanation: "Gorpcore goes out — tech fleece vest, clean cargo joggers, Salomons, crossbody. Mountain-chic at the house party.",
    items: [
      { itemType: "catalog", position: "top", name: "Graphic Long Sleeve Tee", brand: "Patagonia", price: 55, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "bottom", name: "Tech Cargo Joggers", brand: "Nike ACG", price: 130, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "shoes", name: "XT-6", brand: "Salomon", price: 175, imageUrl: "", affiliateUrl: "", color: "silver" },
      { itemType: "catalog", position: "outerwear", name: "Fleece Vest", brand: "Patagonia", price: 129, imageUrl: "", affiliateUrl: "", color: "sage" },
    ],
  },
  {
    occasion: "work",
    styleExplanation: "Office gorpcore — quilted vest over a henley, chinos, trail sneakers. Tech bro meets outdoors guy. Works at a startup that has a climbing wall.",
    items: [
      { itemType: "catalog", position: "top", name: "Merino Henley", brand: "Icebreaker", price: 85, imageUrl: "", affiliateUrl: "", color: "grey" },
      { itemType: "catalog", position: "bottom", name: "Stretch Chinos", brand: "prAna", price: 85, imageUrl: "", affiliateUrl: "", color: "khaki" },
      { itemType: "catalog", position: "shoes", name: "Cloudmonster", brand: "On Running", price: 170, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "outerwear", name: "Quilted Vest", brand: "Patagonia", price: 149, imageUrl: "", affiliateUrl: "", color: "navy" },
    ],
  },
];

// ─── CLEAN GIRL ──────────────────────────────────────
const CLEAN_GIRL: EditorOutfit[] = [
  {
    occasion: "casual",
    styleExplanation: "Effortless clean girl — ribbed tank, wide-leg jeans, clean sneakers, gold hoops. Dewy skin and slicked-back hair not included.",
    items: [
      { itemType: "catalog", position: "top", name: "Ribbed Tank Top", brand: "Skims", price: 32, imageUrl: "", affiliateUrl: "", color: "white" },
      { itemType: "catalog", position: "bottom", name: "High-Rise Wide Leg Jeans", brand: "Agolde", price: 198, imageUrl: "", affiliateUrl: "", color: "light_wash" },
      { itemType: "catalog", position: "shoes", name: "V-10 Sneakers", brand: "Veja", price: 150, imageUrl: "", affiliateUrl: "", color: "white" },
      { itemType: "catalog", position: "accessory", name: "Mini Gold Hoops", brand: "Mejuri", price: 48, imageUrl: "", affiliateUrl: "", color: "gold" },
    ],
  },
  {
    occasion: "work",
    styleExplanation: "Clean girl office — matching set, pointed mules, minimal jewelry. Polished, put-together, never overdone.",
    items: [
      { itemType: "catalog", position: "top", name: "Linen Blend Blazer", brand: "Zara", price: 89, imageUrl: "", affiliateUrl: "", color: "beige" },
      { itemType: "catalog", position: "bottom", name: "Matching Trousers", brand: "Zara", price: 49, imageUrl: "", affiliateUrl: "", color: "beige" },
      { itemType: "catalog", position: "shoes", name: "Pointed Mules", brand: "Aeyde", price: 285, imageUrl: "", affiliateUrl: "", color: "camel" },
      { itemType: "catalog", position: "accessory", name: "Thin Gold Chain", brand: "Mejuri", price: 58, imageUrl: "", affiliateUrl: "", color: "gold" },
    ],
  },
  {
    occasion: "date",
    styleExplanation: "Clean girl date night — satin slip dress, strappy sandals, dainty necklace. Simple, elegant, glowing.",
    items: [
      { itemType: "catalog", position: "top", name: "Satin Slip Midi Dress", brand: "Aritzia", price: 148, imageUrl: "", affiliateUrl: "", color: "champagne" },
      { itemType: "catalog", position: "shoes", name: "Strappy Heeled Sandals", brand: "Steve Madden", price: 89, imageUrl: "", affiliateUrl: "", color: "nude" },
      { itemType: "catalog", position: "accessory", name: "Dainty Layered Necklaces", brand: "Gorjana", price: 85, imageUrl: "", affiliateUrl: "", color: "gold" },
    ],
  },
  {
    occasion: "casual",
    weather: "cool",
    styleExplanation: "Fall clean girl — cashmere hoodie, tailored joggers, UGG minis, slick bun. Elevated comfort that still turns heads.",
    items: [
      { itemType: "catalog", position: "top", name: "Cashmere Hoodie", brand: "Naadam", price: 175, imageUrl: "", affiliateUrl: "", color: "oatmeal" },
      { itemType: "catalog", position: "bottom", name: "Tailored Joggers", brand: "Aritzia", price: 78, imageUrl: "", affiliateUrl: "", color: "grey" },
      { itemType: "catalog", position: "shoes", name: "Ultra Mini Boots", brand: "UGG", price: 160, imageUrl: "", affiliateUrl: "", color: "chestnut" },
      { itemType: "catalog", position: "accessory", name: "Gold Claw Clip", brand: "Celine", price: 420, imageUrl: "", affiliateUrl: "", color: "gold" },
    ],
  },
];

// ─── INDIE/BOHO ──────────────────────────────────────
const INDIE_BOHO: EditorOutfit[] = [
  {
    occasion: "casual",
    styleExplanation: "Festival-ready boho — crochet top, flowy pants, gladiator sandals, layered jewelry. Stevie Nicks at a farmer's market.",
    items: [
      { itemType: "catalog", position: "top", name: "Crochet Halter Top", brand: "Free People", price: 68, imageUrl: "", affiliateUrl: "", color: "cream" },
      { itemType: "catalog", position: "bottom", name: "Flowy Wide-Leg Pants", brand: "Free People", price: 108, imageUrl: "", affiliateUrl: "", color: "rust" },
      { itemType: "catalog", position: "shoes", name: "Gladiator Sandals", brand: "Sam Edelman", price: 120, imageUrl: "", affiliateUrl: "", color: "tan" },
      { itemType: "catalog", position: "accessory", name: "Layered Coin Necklaces", brand: "Gorjana", price: 95, imageUrl: "", affiliateUrl: "", color: "gold" },
    ],
  },
  {
    occasion: "party",
    styleExplanation: "Boho night out — embroidered kimono over a cami, flared jeans, suede boots. Festival headliner backstage energy.",
    items: [
      { itemType: "catalog", position: "top", name: "Silk Camisole", brand: "Anthropologie", price: 58, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "bottom", name: "High-Rise Flare Jeans", brand: "Free People", price: 98, imageUrl: "", affiliateUrl: "", color: "dark_wash" },
      { itemType: "catalog", position: "shoes", name: "Suede Western Boots", brand: "Isabel Marant", price: 790, imageUrl: "", affiliateUrl: "", color: "tan" },
      { itemType: "catalog", position: "outerwear", name: "Embroidered Kimono", brand: "Johnny Was", price: 298, imageUrl: "", affiliateUrl: "", color: "rust" },
    ],
  },
  {
    occasion: "date",
    styleExplanation: "Romantic boho date — off-shoulder maxi, platform sandals, turquoise rings. Free-spirited and feminine.",
    items: [
      { itemType: "catalog", position: "top", name: "Off-Shoulder Maxi Dress", brand: "Free People", price: 168, imageUrl: "", affiliateUrl: "", color: "terracotta" },
      { itemType: "catalog", position: "shoes", name: "Platform Wedge Sandals", brand: "Soludos", price: 95, imageUrl: "", affiliateUrl: "", color: "natural" },
      { itemType: "catalog", position: "accessory", name: "Turquoise Ring Set", brand: "Chan Luu", price: 78, imageUrl: "", affiliateUrl: "", color: "turquoise" },
    ],
  },
  {
    occasion: "casual",
    weather: "cool",
    styleExplanation: "Fall boho — oversized suede jacket, printed midi skirt, ankle boots. Desert sunset colors, city-ready layers.",
    items: [
      { itemType: "catalog", position: "top", name: "Graphic Band Tee", brand: "Urban Outfitters", price: 34, imageUrl: "", affiliateUrl: "", color: "black" },
      { itemType: "catalog", position: "bottom", name: "Printed Midi Skirt", brand: "Anthropologie", price: 118, imageUrl: "", affiliateUrl: "", color: "rust" },
      { itemType: "catalog", position: "shoes", name: "Suede Ankle Boots", brand: "Free People", price: 178, imageUrl: "", affiliateUrl: "", color: "brown" },
      { itemType: "catalog", position: "outerwear", name: "Suede Jacket", brand: "AllSaints", price: 499, imageUrl: "", affiliateUrl: "", color: "tan" },
    ],
  },
];

// ─── Registry — maps genre slugs to their editor picks ───
const EDITORS_PICKS: Record<string, EditorOutfit[]> = {
  "old-money": OLD_MONEY,
  "streetwear": STREETWEAR,
  "minimalist": MINIMALIST,
  "y2k": Y2K,
  "dark-academia": DARK_ACADEMIA,
  "cottagecore": COTTAGECORE,
  "grunge": GRUNGE,
  "coquette": COQUETTE,
  "coastal-grandma": COASTAL_GRANDMA,
  "gorpcore": GORPCORE,
  "clean-girl": CLEAN_GIRL,
  "indie-boho": INDIE_BOHO,
};

// ─── Public API ──────────────────────────────────────
// Get editor's picks for a genre, optionally filtered by occasion
export function getEditorsPicks(
  genreSlug: string,
  occasion?: string,
): Outfit[] {
  const picks = EDITORS_PICKS[genreSlug] || EDITORS_PICKS["minimalist"]!;

  // Filter by occasion if specified, otherwise return all
  const filtered = occasion
    ? picks.filter((p) => p.occasion === occasion)
    : picks;

  // Fall back to all picks if no match for the occasion
  const source = filtered.length > 0 ? filtered : picks;

  return source.map((pick) => ({
    id: nanoid(),
    genreSlug,
    occasion: pick.occasion as Outfit["occasion"],
    weather: pick.weather as Outfit["weather"],
    items: pick.items.map((item) => ({
      ...item,
      itemId: nanoid(),
    })),
    styleExplanation: pick.styleExplanation,
    totalPrice: pick.items.reduce((sum, i) => sum + (i.price || 0), 0),
    source: "editors-pick" as const,
  }));
}
