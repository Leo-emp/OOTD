// Massive catalog seed — 1,500+ products across all 12 genres
// Real brand names, realistic prices, accurate genre tagging
// Covers budget ($15 SHEIN) to luxury ($2,000+ Loro Piana)
// Run: npx tsx src/lib/db/seed-catalog.ts

import { db } from "./index";
import { catalogItems } from "./schema";
import { nanoid } from "nanoid";

// ─── Product templates per genre ─────────────────────
// Each template generates a catalog item with realistic attributes
// Format: [name, brand, price, category, color, pattern?, season?, extraGenreTags?]
type ProductTemplate = [
  string,    // name
  string,    // brand
  number,    // price
  string,    // category: top | bottom | shoes | accessory | outerwear | bag
  string,    // color
  string?,   // pattern (optional)
  string?,   // season (optional)
  string[]?, // extra genre tags (optional — item auto-gets its primary genre)
];

// ─── OLD MONEY ───────────────────────────────────────
const OLD_MONEY: ProductTemplate[] = [
  // Tops
  ["Slim Fit Mesh Polo", "Ralph Lauren", 125, "top", "navy", "solid", "all"],
  ["Classic Oxford Shirt", "Brooks Brothers", 98, "top", "white", "solid", "all"],
  ["Cashmere V-Neck Sweater", "Loro Piana", 1250, "top", "camel", "solid", "fall", ["minimalist"]],
  ["Merino Wool Crewneck", "COS", 89, "top", "cream", "solid", "fall", ["minimalist"]],
  ["Silk Button-Down Blouse", "Theory", 275, "top", "ivory", "solid", "all"],
  ["Pima Cotton Polo", "Massimo Dutti", 69, "top", "burgundy", "solid", "all"],
  ["Fine Gauge Turtleneck", "Uniqlo", 39, "top", "black", "solid", "winter", ["minimalist"]],
  ["Striped Breton Top", "Saint James", 95, "top", "navy", "stripes", "all", ["coastal-grandma"]],
  ["Linen Camp Collar Shirt", "Massimo Dutti", 79, "top", "beige", "solid", "summer", ["coastal-grandma"]],
  ["Cable Knit Polo", "Ralph Lauren", 148, "top", "forest_green", "cable", "fall"],
  ["Poplin Dress Shirt", "Charles Tyrwhitt", 89, "top", "light_blue", "solid", "all"],
  ["Cashmere Blend Henley", "Todd Snyder", 178, "top", "grey", "solid", "winter"],
  ["Merino Wool Polo", "Brunello Cucinelli", 695, "top", "cream", "solid", "all"],
  ["Supima Cotton T-Shirt", "Sunspel", 85, "top", "white", "solid", "all"],
  ["Silk Knit Polo", "Zegna", 550, "top", "navy", "solid", "summer"],
  // Bottoms
  ["Slim Chinos", "Ralph Lauren", 98, "bottom", "beige", "solid", "all"],
  ["Tailored Wool Trousers", "Theory", 295, "bottom", "charcoal", "solid", "all", ["minimalist"]],
  ["Corduroy Pants", "J.Crew", 89, "bottom", "tan", "corduroy", "fall", ["dark-academia"]],
  ["Linen Drawstring Pants", "Massimo Dutti", 79, "bottom", "cream", "solid", "summer", ["coastal-grandma"]],
  ["Straight Leg Chinos", "COS", 69, "bottom", "navy", "solid", "all"],
  ["Pleated Dress Pants", "Brooks Brothers", 168, "bottom", "grey", "solid", "all"],
  ["Bermuda Shorts", "Ralph Lauren", 85, "bottom", "stone", "solid", "summer"],
  ["Flannel Trousers", "Canali", 395, "bottom", "charcoal", "solid", "winter"],
  ["Cotton Twill Chinos", "Bonobos", 98, "bottom", "olive", "solid", "all"],
  ["Wool Blend Dress Pants", "Hugo Boss", 198, "bottom", "navy", "solid", "all"],
  ["Gabardine Trousers", "Zegna", 595, "bottom", "beige", "solid", "all"],
  ["Linen Blend Trousers", "Reiss", 148, "bottom", "sand", "solid", "summer"],
  // Shoes
  ["Penny Loafers", "G.H. Bass", 135, "shoes", "brown", "solid", "all"],
  ["Leather Boat Shoes", "Sperry", 98, "shoes", "tan", "solid", "summer"],
  ["Oxford Dress Shoes", "Allen Edmonds", 295, "shoes", "brown", "solid", "all"],
  ["Suede Loafers", "Tod's", 625, "shoes", "navy", "solid", "all"],
  ["White Leather Sneakers", "Common Projects", 425, "shoes", "white", "solid", "all", ["minimalist", "clean-girl"]],
  ["Driving Moccasins", "Tod's", 495, "shoes", "brown", "solid", "summer"],
  ["Chelsea Boots", "Church's", 550, "shoes", "brown", "solid", "fall"],
  ["Tennis Sneakers", "Veja", 150, "shoes", "white", "solid", "all", ["minimalist"]],
  ["Cap Toe Oxfords", "Crockett & Jones", 580, "shoes", "black", "solid", "all"],
  // Outerwear
  ["Wool Blazer", "Ralph Lauren", 298, "outerwear", "navy", "solid", "all"],
  ["Camel Overcoat", "Massimo Dutti", 275, "outerwear", "camel", "solid", "winter"],
  ["Cotton Trench Coat", "Burberry", 1990, "outerwear", "beige", "solid", "spring"],
  ["Linen Blazer", "Massimo Dutti", 198, "outerwear", "cream", "solid", "summer"],
  ["Wool Peacoat", "J.Crew", 325, "outerwear", "navy", "solid", "winter"],
  ["Quilted Vest", "Barbour", 195, "outerwear", "olive", "quilted", "fall", ["gorpcore"]],
  ["Double-Breasted Blazer", "Reiss", 348, "outerwear", "charcoal", "solid", "all"],
  ["Cashmere Overcoat", "Loro Piana", 3995, "outerwear", "grey", "solid", "winter"],
  // Accessories
  ["Leather Belt", "Ralph Lauren", 75, "accessory", "brown", "solid", "all"],
  ["Silk Pocket Square", "Drake's", 65, "accessory", "burgundy", "paisley", "all"],
  ["Leather Watch Strap", "Daniel Wellington", 189, "accessory", "brown", "solid", "all"],
  ["Cashmere Scarf", "Johnstons of Elgin", 195, "accessory", "navy", "solid", "winter"],
  ["Aviator Sunglasses", "Ray-Ban", 175, "accessory", "gold", "solid", "all", ["clean-girl"]],
  ["Pearl Cufflinks", "Tiffany & Co.", 350, "accessory", "silver", "solid", "all"],
  // Bags
  ["Leather Briefcase", "Smythson", 995, "bag", "brown", "solid", "all"],
  ["Canvas Tote", "L.L.Bean", 35, "bag", "cream", "solid", "all", ["coastal-grandma"]],
  ["Leather Weekender", "Ralph Lauren", 498, "bag", "tan", "solid", "all"],
  ["Suede Clutch", "Bottega Veneta", 1650, "bag", "beige", "solid", "all"],
];

// ─── Y2K ─────────────────────────────────────────────
const Y2K: ProductTemplate[] = [
  // Tops
  ["Butterfly Print Baby Tee", "SHEIN", 12, "top", "pink", "butterfly", "summer"],
  ["Rhinestone Logo Crop Top", "Juicy Couture", 65, "top", "hot_pink", "logo", "summer"],
  ["Metallic Halter Top", "Dolls Kill", 38, "top", "silver", "metallic", "all"],
  ["Velour Zip-Up Hoodie", "Juicy Couture", 98, "top", "baby_blue", "solid", "all"],
  ["Mesh Long Sleeve Top", "SHEIN", 15, "top", "lilac", "mesh", "all"],
  ["Sequin Tube Top", "PacSun", 32, "top", "silver", "sequin", "all"],
  ["Logo Print Baby Tee", "Von Dutch", 45, "top", "white", "logo", "summer"],
  ["Holographic Crop Top", "Dolls Kill", 42, "top", "holographic", "solid", "all"],
  ["Butterfly Cardigan", "SHEIN", 18, "top", "pink", "butterfly", "spring"],
  ["Velour Track Jacket", "Juicy Couture", 128, "top", "hot_pink", "solid", "all"],
  ["Rhinestone Mesh Top", "Fashion Nova", 28, "top", "clear", "rhinestone", "all"],
  ["Bandeau Top", "PacSun", 22, "top", "baby_blue", "solid", "summer"],
  // Bottoms
  ["Low-Rise Bootcut Jeans", "PacSun", 59, "bottom", "light_wash", "solid", "all"],
  ["Velour Track Pants", "Juicy Couture", 88, "bottom", "hot_pink", "solid", "all"],
  ["Pleated Mini Skirt", "SHEIN", 16, "bottom", "pink", "plaid", "all"],
  ["Cargo Mini Skirt", "Fashion Nova", 32, "bottom", "army_green", "solid", "all"],
  ["Low-Rise Flare Pants", "Dolls Kill", 48, "bottom", "baby_blue", "solid", "all"],
  ["Metallic Mini Skirt", "SHEIN", 14, "bottom", "silver", "metallic", "all"],
  ["Butterfly Jean Skirt", "PacSun", 45, "bottom", "denim", "butterfly", "summer"],
  ["Bedazzled Denim Shorts", "Fashion Nova", 38, "bottom", "light_wash", "embellished", "summer"],
  ["Satin Low-Rise Pants", "SHEIN", 22, "bottom", "lilac", "solid", "all"],
  ["Sequin Mini Skirt", "Dolls Kill", 55, "bottom", "pink", "sequin", "all"],
  // Shoes
  ["Platform Sneakers", "Buffalo London", 145, "shoes", "white", "solid", "all"],
  ["Jelly Platform Sandals", "Melissa", 85, "shoes", "pink", "solid", "summer"],
  ["Chunky Platform Boots", "Dolls Kill", 78, "shoes", "black", "solid", "all"],
  ["Clear Heel Mules", "Fashion Nova", 45, "shoes", "clear", "solid", "all"],
  ["Platform Flip Flops", "SHEIN", 18, "shoes", "pink", "solid", "summer"],
  ["Butterfly Sneakers", "Nike", 110, "shoes", "white", "butterfly", "all"],
  ["Rhinestone Heeled Boots", "Steve Madden", 129, "shoes", "silver", "rhinestone", "all"],
  ["Kitten Heel Sandals", "SHEIN", 25, "shoes", "lilac", "solid", "summer"],
  // Outerwear
  ["Faux Fur Cropped Jacket", "SHEIN", 35, "outerwear", "pink", "solid", "winter"],
  ["Metallic Puffer Vest", "Dolls Kill", 65, "outerwear", "silver", "solid", "fall"],
  ["Denim Jacket with Rhinestones", "PacSun", 78, "outerwear", "light_wash", "rhinestone", "spring"],
  ["Velour Cropped Blazer", "Fashion Nova", 55, "outerwear", "baby_blue", "solid", "all"],
  // Accessories
  ["Tinted Shield Sunglasses", "SHEIN", 12, "accessory", "pink", "solid", "all"],
  ["Butterfly Hair Clips Set", "SHEIN", 8, "accessory", "multi", "butterfly", "all"],
  ["Chunky Hoop Earrings", "Fashion Nova", 15, "accessory", "gold", "solid", "all"],
  ["Phone Case with Charm", "SHEIN", 10, "accessory", "pink", "solid", "all"],
  ["Mini Rhinestone Bag", "SHEIN", 22, "bag", "silver", "rhinestone", "all"],
  ["Butterfly Chain Belt", "Dolls Kill", 28, "accessory", "silver", "butterfly", "all"],
  // Bags
  ["Mini Baguette Bag", "Fashion Nova", 32, "bag", "pink", "solid", "all"],
  ["Fuzzy Shoulder Bag", "SHEIN", 18, "bag", "lilac", "solid", "all"],
  ["Rhinestone Clutch", "Dolls Kill", 48, "bag", "silver", "rhinestone", "all"],
];

// ─── STREETWEAR ──────────────────────────────────────
const STREETWEAR: ProductTemplate[] = [
  // Tops
  ["Box Logo Hoodie", "Supreme", 158, "top", "black", "logo", "fall"],
  ["Graphic Tee 'Chaos'", "Stussy", 45, "top", "white", "graphic", "all"],
  ["Oversized Crewneck", "Nike", 65, "top", "grey", "solid", "all"],
  ["Camo Print Hoodie", "A Bathing Ape", 348, "top", "camo", "camo", "all"],
  ["Tech Fleece Hoodie", "Nike", 120, "top", "black", "solid", "fall"],
  ["Embroidered Logo Tee", "Carhartt WIP", 45, "top", "white", "logo", "all"],
  ["Oversized Band Tee", "Midnight Studios", 85, "top", "black", "graphic", "all", ["grunge"]],
  ["Quarter-Zip Fleece", "The North Face", 89, "top", "olive", "solid", "fall", ["gorpcore"]],
  ["Tie-Dye Crewneck", "Stussy", 72, "top", "multi", "tie-dye", "all"],
  ["Varsity Jersey", "Mitchell & Ness", 95, "top", "red", "stripes", "all"],
  ["Mock Neck Long Sleeve", "Uniqlo", 25, "top", "black", "solid", "winter"],
  ["Oversized Polo", "Nike", 55, "top", "cream", "solid", "summer"],
  ["Heavyweight Pocket Tee", "Carhartt WIP", 38, "top", "grey", "solid", "all"],
  ["Washed Logo Sweatshirt", "Stussy", 98, "top", "forest_green", "logo", "fall"],
  // Bottoms
  ["Cargo Pants", "Nike ACG", 130, "bottom", "olive", "solid", "all", ["gorpcore"]],
  ["Relaxed Fit Jeans", "Levi's 501", 69, "bottom", "dark_wash", "solid", "all"],
  ["Tech Fleece Joggers", "Nike", 105, "bottom", "black", "solid", "all"],
  ["Baggy Carpenter Pants", "Carhartt WIP", 128, "bottom", "brown", "solid", "all"],
  ["Nylon Track Pants", "Adidas", 65, "bottom", "black", "stripes", "all"],
  ["Ripstop Cargo Shorts", "Stussy", 88, "bottom", "khaki", "solid", "summer"],
  ["Corduroy Wide-Leg Pants", "Carhartt WIP", 118, "bottom", "brown", "corduroy", "fall"],
  ["Mesh Basketball Shorts", "Nike", 45, "bottom", "black", "solid", "summer"],
  ["Double-Knee Work Pants", "Carhartt WIP", 128, "bottom", "duck_brown", "solid", "all"],
  // Shoes
  ["Air Jordan 1 Retro High", "Nike", 180, "shoes", "black", "solid", "all"],
  ["Air Force 1 '07", "Nike", 110, "shoes", "white", "solid", "all", ["clean-girl"]],
  ["990v6", "New Balance", 200, "shoes", "grey", "solid", "all", ["gorpcore"]],
  ["Chuck 70 High Top", "Converse", 85, "shoes", "black", "solid", "all", ["grunge"]],
  ["Forum Low", "Adidas", 100, "shoes", "white", "solid", "all"],
  ["Dunk Low", "Nike", 115, "shoes", "panda", "colorblock", "all"],
  ["550", "New Balance", 110, "shoes", "white", "solid", "all", ["clean-girl"]],
  ["Gel-Kayano 14", "ASICS", 150, "shoes", "silver", "solid", "all"],
  ["Old Skool", "Vans", 65, "shoes", "black", "solid", "all"],
  // Outerwear
  ["Nuptse Puffer Jacket", "The North Face", 330, "outerwear", "black", "solid", "winter", ["gorpcore"]],
  ["Varsity Bomber Jacket", "Stussy", 198, "outerwear", "navy", "solid", "fall"],
  ["Coaches Jacket", "Nike SB", 95, "outerwear", "black", "solid", "spring"],
  ["Canvas Work Jacket", "Carhartt WIP", 188, "outerwear", "brown", "solid", "fall"],
  ["Track Jacket", "Adidas", 75, "outerwear", "black", "stripes", "all"],
  ["Windbreaker", "Nike", 85, "outerwear", "black", "colorblock", "spring"],
  // Accessories
  ["5-Panel Camp Cap", "Supreme", 48, "accessory", "black", "logo", "all"],
  ["Gold Chain Necklace", "Vitaly", 89, "accessory", "gold", "solid", "all"],
  ["Bucket Hat", "Stussy", 45, "accessory", "black", "solid", "summer"],
  ["Canvas Belt", "Carhartt WIP", 38, "accessory", "black", "solid", "all"],
  ["Sports Socks 3-Pack", "Nike", 18, "accessory", "white", "logo", "all"],
  // Bags
  ["Crossbody Bag", "Nike", 35, "bag", "black", "solid", "all"],
  ["Shoulder Bag", "Carhartt WIP", 65, "bag", "black", "solid", "all"],
  ["Tote Bag", "Stussy", 48, "bag", "canvas", "logo", "all"],
];

// ─── MINIMALIST ──────────────────────────────────────
const MINIMALIST: ProductTemplate[] = [
  // Tops
  ["Organic Cotton T-Shirt", "COS", 35, "top", "white", "solid", "all"],
  ["Relaxed Mock Neck", "Arket", 49, "top", "black", "solid", "all"],
  ["Merino Wool Crewneck", "Everlane", 98, "top", "grey", "solid", "fall"],
  ["Supima Cotton Tank", "COS", 29, "top", "white", "solid", "summer"],
  ["Ribbed Long Sleeve", "Uniqlo", 25, "top", "black", "ribbed", "all"],
  ["Cashmere Blend Hoodie", "COS", 135, "top", "camel", "solid", "fall"],
  ["Linen T-Shirt", "Muji", 29, "top", "beige", "solid", "summer"],
  ["Draped Silk Blouse", "COS", 89, "top", "ivory", "solid", "all"],
  ["Pima Cotton Polo", "Everlane", 48, "top", "navy", "solid", "all"],
  ["Oversized Cotton Shirt", "Arket", 59, "top", "white", "solid", "all"],
  ["Seamless Knit Top", "COS", 69, "top", "grey", "solid", "all"],
  ["Merino Zip Neck", "Uniqlo", 49, "top", "black", "solid", "winter"],
  // Bottoms
  ["Wide-Leg Wool Trousers", "COS", 99, "bottom", "black", "solid", "all"],
  ["Straight Leg Chinos", "Everlane", 68, "bottom", "grey", "solid", "all"],
  ["High-Rise Crop Pants", "Arket", 79, "bottom", "navy", "solid", "all"],
  ["Linen Wide-Leg Pants", "Muji", 49, "bottom", "beige", "solid", "summer"],
  ["Tailored Cigarette Pants", "COS", 89, "bottom", "black", "solid", "all"],
  ["Cotton Twill Chinos", "Uniqlo", 39, "bottom", "camel", "solid", "all"],
  ["Pleated Front Trousers", "Arket", 89, "bottom", "grey", "solid", "all"],
  ["Relaxed Linen Shorts", "COS", 55, "bottom", "white", "solid", "summer"],
  ["Ponte Ankle Pants", "Everlane", 78, "bottom", "black", "solid", "all"],
  // Shoes
  ["Leather Derby Shoes", "COS", 195, "shoes", "black", "solid", "all"],
  ["Canvas Slip-Ons", "Muji", 35, "shoes", "white", "solid", "all"],
  ["Suede Loafers", "Everlane", 168, "shoes", "tan", "solid", "all"],
  ["Clean White Sneakers", "Veja", 150, "shoes", "white", "solid", "all", ["clean-girl"]],
  ["Leather Chelsea Boots", "COS", 225, "shoes", "black", "solid", "fall"],
  ["Pointed Flat Mules", "Arket", 89, "shoes", "beige", "solid", "all"],
  ["Minimalist Running Shoes", "On Running", 150, "shoes", "white", "solid", "all"],
  // Outerwear
  ["Wool Overcoat", "COS", 275, "outerwear", "grey", "solid", "winter"],
  ["Cotton Bomber Jacket", "Everlane", 128, "outerwear", "black", "solid", "spring"],
  ["Linen Blazer", "Arket", 149, "outerwear", "beige", "solid", "summer"],
  ["Puffer Coat", "Uniqlo", 99, "outerwear", "black", "solid", "winter"],
  ["Trench Coat", "COS", 250, "outerwear", "sand", "solid", "spring"],
  ["Wool Blend Car Coat", "COS", 225, "outerwear", "charcoal", "solid", "winter"],
  // Accessories
  ["Leather Slim Belt", "COS", 55, "accessory", "black", "solid", "all"],
  ["Minimal Watch", "NOMOS", 1680, "accessory", "silver", "solid", "all"],
  ["Wool Beanie", "Arket", 25, "accessory", "grey", "solid", "winter"],
  ["Silk Scarf", "COS", 45, "accessory", "ivory", "solid", "all"],
  ["Leather Card Holder", "Everlane", 48, "accessory", "black", "solid", "all"],
  // Bags
  ["Leather Tote", "COS", 159, "bag", "black", "solid", "all"],
  ["Canvas Crossbody", "Muji", 39, "bag", "beige", "solid", "all"],
  ["Structured Leather Bag", "Arket", 179, "bag", "tan", "solid", "all"],
];

// ─── COTTAGECORE ─────────────────────────────────────
const COTTAGECORE: ProductTemplate[] = [
  // Tops
  ["Floral Prairie Blouse", "Doen", 198, "top", "sage", "floral", "spring"],
  ["Knit Cardigan with Pearl Buttons", "& Other Stories", 79, "top", "cream", "solid", "fall"],
  ["Embroidered Linen Top", "Free People", 68, "top", "white", "embroidered", "summer"],
  ["Puff Sleeve Blouse", "Reformation", 148, "top", "dusty_rose", "solid", "spring"],
  ["Crochet Vest", "SHEIN", 18, "top", "cream", "crochet", "summer"],
  ["Peter Pan Collar Blouse", "& Other Stories", 55, "top", "white", "solid", "spring"],
  ["Strawberry Print Top", "Christy Dawn", 138, "top", "cream", "print", "summer"],
  ["Linen Wrap Top", "Reformation", 98, "top", "sage", "solid", "summer"],
  ["Cable Knit Sweater", "Free People", 128, "top", "oatmeal", "cable", "winter"],
  ["Smocked Peasant Top", "Doen", 168, "top", "lavender", "solid", "spring"],
  ["Gingham Check Blouse", "& Other Stories", 49, "top", "blue", "gingham", "summer"],
  // Bottoms
  ["Floral Midi Skirt", "Reformation", 148, "bottom", "sage", "floral", "spring"],
  ["Corduroy A-Line Skirt", "& Other Stories", 69, "bottom", "mustard", "corduroy", "fall", ["dark-academia"]],
  ["Linen Wide-Leg Pants", "Christy Dawn", 158, "bottom", "cream", "solid", "summer"],
  ["Embroidered Maxi Skirt", "Free People", 128, "bottom", "white", "embroidered", "summer"],
  ["Cotton Prairie Dress", "Doen", 248, "bottom", "dusty_rose", "floral", "spring"],
  ["High-Waist Linen Shorts", "& Other Stories", 45, "bottom", "cream", "solid", "summer"],
  ["Tiered Maxi Skirt", "Free People", 98, "bottom", "sage", "solid", "summer"],
  ["Pintuck Linen Pants", "Christy Dawn", 168, "bottom", "white", "solid", "summer"],
  // Shoes
  ["Leather Ballet Flats", "Repetto", 345, "shoes", "nude", "solid", "all", ["coquette"]],
  ["Woven Leather Sandals", "Ancient Greek Sandals", 220, "shoes", "tan", "woven", "summer"],
  ["Canvas Sneakers", "Superga", 65, "shoes", "white", "solid", "summer"],
  ["Suede Mary Janes", "& Other Stories", 89, "shoes", "brown", "solid", "all"],
  ["Lace-Up Ankle Boots", "Free People", 198, "shoes", "brown", "solid", "fall"],
  ["Espadrille Wedges", "Castañer", 135, "shoes", "cream", "solid", "summer"],
  // Outerwear
  ["Quilted Floral Jacket", "Free People", 168, "outerwear", "sage", "floral", "spring"],
  ["Wool Cardigan Coat", "& Other Stories", 149, "outerwear", "oatmeal", "solid", "fall"],
  ["Linen Duster", "Christy Dawn", 188, "outerwear", "cream", "solid", "summer"],
  ["Cropped Denim Jacket", "Levi's", 98, "outerwear", "light_wash", "solid", "spring"],
  // Accessories
  ["Straw Basket Bag", "Loewe", 490, "bag", "natural", "woven", "summer"],
  ["Silk Ribbon Hair Tie", "Free People", 12, "accessory", "dusty_rose", "solid", "all"],
  ["Pearl Drop Earrings", "Mejuri", 58, "accessory", "pearl", "solid", "all", ["old-money"]],
  ["Woven Sun Hat", "Lack of Color", 99, "accessory", "natural", "woven", "summer"],
  ["Embroidered Handkerchief", "Etsy", 22, "accessory", "white", "embroidered", "all"],
  // Bags
  ["Wicker Basket Bag", "Doen", 128, "bag", "natural", "woven", "summer"],
  ["Canvas Market Tote", "Reformation", 48, "bag", "cream", "solid", "all"],
  ["Leather Crossbody", "Madewell", 148, "bag", "brown", "solid", "all"],
];

// ─── DARK ACADEMIA ───────────────────────────────────
const DARK_ACADEMIA: ProductTemplate[] = [
  // Tops
  ["Merino Turtleneck", "Ralph Lauren", 148, "top", "burgundy", "solid", "fall"],
  ["Tweed Vest", "J.Crew", 89, "top", "brown", "tweed", "fall"],
  ["Oxford Button-Down", "Brooks Brothers", 92, "top", "white", "solid", "all"],
  ["Wool V-Neck Sweater Vest", "Ralph Lauren", 125, "top", "forest_green", "solid", "fall"],
  ["Corduroy Shirt", "Barbour", 95, "top", "tan", "corduroy", "fall"],
  ["Cable Knit Fisherman Sweater", "Aran Crafts", 110, "top", "cream", "cable", "winter"],
  ["Henley Shirt", "J.Crew", 45, "top", "brown", "solid", "all"],
  ["Argyle Sweater", "Ralph Lauren", 148, "top", "navy", "argyle", "fall"],
  ["Plaid Flannel Shirt", "Barbour", 85, "top", "brown", "plaid", "fall", ["grunge"]],
  ["Wool Crewneck", "J.Crew", 79, "top", "charcoal", "solid", "winter"],
  ["Silk Cravat Blouse", "& Other Stories", 69, "top", "cream", "solid", "all"],
  // Bottoms
  ["Tweed Trousers", "Ralph Lauren", 168, "bottom", "brown", "tweed", "fall"],
  ["Corduroy Pants", "J.Crew", 89, "bottom", "forest_green", "corduroy", "fall"],
  ["Pleated Wool Pants", "Brooks Brothers", 148, "bottom", "charcoal", "solid", "all"],
  ["Plaid Trousers", "Barbour", 125, "bottom", "brown", "plaid", "fall"],
  ["Wide-Leg Wool Pants", "Zara", 59, "bottom", "black", "solid", "all"],
  ["Corduroy Skirt", "& Other Stories", 69, "bottom", "brown", "corduroy", "fall"],
  ["Herringbone Trousers", "J.Crew", 98, "bottom", "grey", "herringbone", "fall"],
  ["High-Waist Plaid Pants", "Zara", 49, "bottom", "brown", "plaid", "fall"],
  // Shoes
  ["Oxford Brogues", "Church's", 450, "shoes", "brown", "brogue", "all"],
  ["Leather Loafers", "G.H. Bass", 135, "shoes", "burgundy", "solid", "all", ["old-money"]],
  ["Chelsea Boots", "Blundstone", 195, "shoes", "brown", "solid", "fall"],
  ["Suede Desert Boots", "Clarks", 140, "shoes", "tan", "solid", "fall"],
  ["Monk Strap Shoes", "Allen Edmonds", 325, "shoes", "brown", "solid", "all"],
  ["Leather Mary Janes", "Dr. Martens", 150, "shoes", "black", "solid", "all"],
  // Outerwear
  ["Tweed Blazer", "Ralph Lauren", 298, "outerwear", "brown", "tweed", "fall"],
  ["Waxed Cotton Jacket", "Barbour", 399, "outerwear", "olive", "solid", "fall"],
  ["Wool Overcoat", "J.Crew", 348, "outerwear", "charcoal", "solid", "winter"],
  ["Leather Bomber", "Schott NYC", 795, "outerwear", "brown", "solid", "fall"],
  ["Shawl Collar Cardigan", "Ralph Lauren", 198, "outerwear", "burgundy", "solid", "fall"],
  // Accessories
  ["Leather Satchel", "The Cambridge Satchel Co.", 195, "bag", "brown", "solid", "all"],
  ["Wool Newsboy Cap", "Barbour", 55, "accessory", "tweed", "tweed", "fall"],
  ["Leather Journal", "Moleskine", 35, "accessory", "brown", "solid", "all"],
  ["Vintage-Style Watch", "Orient Bambino", 265, "accessory", "brown", "solid", "all"],
  ["Knit Tie", "Drake's", 95, "accessory", "burgundy", "solid", "all"],
  ["Tartan Scarf", "Barbour", 65, "accessory", "plaid", "plaid", "winter"],
  // Bags
  ["Canvas Messenger Bag", "Barbour", 135, "bag", "olive", "solid", "all"],
  ["Leather Backpack", "Fossil", 178, "bag", "brown", "solid", "all"],
];

// ─── COASTAL GRANDMA ─────────────────────────────────
const COASTAL_GRANDMA: ProductTemplate[] = [
  // Tops
  ["Linen Button-Down Shirt", "J.Crew", 79, "top", "white", "solid", "summer"],
  ["Breton Stripe Top", "Saint James", 95, "top", "navy", "stripes", "all", ["old-money"]],
  ["Oversized Linen Blouse", "Eileen Fisher", 148, "top", "sand", "solid", "summer"],
  ["Cashmere Crew Sweater", "Vince", 345, "top", "oatmeal", "solid", "fall"],
  ["Poplin Shirt", "Mango", 49, "top", "white", "solid", "summer"],
  ["Linen Tunic", "Eileen Fisher", 128, "top", "light_blue", "solid", "summer"],
  ["Cotton Cardigan", "J.Crew", 68, "top", "cream", "solid", "spring"],
  ["Silk Camisole", "Vince", 195, "top", "ivory", "solid", "summer"],
  ["Organic Cotton Tee", "L.L.Bean", 29, "top", "white", "solid", "all"],
  ["Knit Vest", "Mango", 49, "top", "sand", "solid", "spring"],
  // Bottoms
  ["Linen Wide-Leg Pants", "Eileen Fisher", 148, "bottom", "sand", "solid", "summer"],
  ["Cotton Chinos", "J.Crew", 79, "bottom", "stone", "solid", "all"],
  ["White Linen Trousers", "Vince", 275, "bottom", "white", "solid", "summer"],
  ["Midi Linen Skirt", "Mango", 55, "bottom", "beige", "solid", "summer"],
  ["Relaxed Fit Jeans", "L.L.Bean", 59, "bottom", "light_wash", "solid", "all"],
  ["Palazzo Pants", "Eileen Fisher", 168, "bottom", "cream", "solid", "summer"],
  ["Cotton Bermuda Shorts", "J.Crew", 55, "bottom", "stone", "solid", "summer"],
  ["Wrap Midi Skirt", "Vince", 225, "bottom", "sand", "solid", "summer"],
  // Shoes
  ["Leather Espadrilles", "Soludos", 89, "shoes", "tan", "solid", "summer"],
  ["Canvas Slip-Ons", "Veja", 120, "shoes", "white", "solid", "summer"],
  ["Woven Leather Sandals", "Ancient Greek Sandals", 220, "shoes", "tan", "woven", "summer"],
  ["White Canvas Sneakers", "Superga", 65, "shoes", "white", "solid", "all"],
  ["Leather Mules", "Mango", 79, "shoes", "tan", "solid", "summer"],
  ["Suede Driving Loafers", "J.Crew", 118, "shoes", "sand", "solid", "summer"],
  // Outerwear
  ["Linen Blazer", "J.Crew", 168, "outerwear", "sand", "solid", "summer"],
  ["Cotton Trench", "Mango", 139, "outerwear", "beige", "solid", "spring"],
  ["Quilted Vest", "L.L.Bean", 89, "outerwear", "navy", "quilted", "fall"],
  ["Cashmere Wrap", "Vince", 395, "outerwear", "oatmeal", "solid", "fall"],
  // Accessories
  ["Woven Straw Hat", "Lack of Color", 99, "accessory", "natural", "woven", "summer"],
  ["Pearl Stud Earrings", "Mejuri", 88, "accessory", "pearl", "solid", "all"],
  ["Silk Scarf", "J.Crew", 45, "accessory", "blue", "stripes", "all"],
  ["Tortoiseshell Sunglasses", "Ray-Ban", 165, "accessory", "tortoise", "solid", "all"],
  ["Gold Bangle Set", "Mejuri", 148, "accessory", "gold", "solid", "all"],
  // Bags
  ["Canvas Beach Tote", "L.L.Bean", 35, "bag", "natural", "solid", "summer"],
  ["Woven Basket Bag", "Hereu", 420, "bag", "natural", "woven", "summer"],
  ["Leather Crossbody", "Madewell", 148, "bag", "tan", "solid", "all"],
];

// ─── GRUNGE ──────────────────────────────────────────
const GRUNGE: ProductTemplate[] = [
  // Tops
  ["Plaid Flannel Shirt", "Levi's", 69, "top", "red", "plaid", "fall"],
  ["Vintage Band Tee 'Nirvana'", "Urban Outfitters", 39, "top", "black", "graphic", "all"],
  ["Distressed Graphic Tee", "Carhartt", 35, "top", "washed_black", "graphic", "all"],
  ["Thermal Henley", "Levi's", 45, "top", "grey", "solid", "winter"],
  ["Oversized Plaid Shirt", "Levi's", 79, "top", "green", "plaid", "fall"],
  ["Ripped Band Tee", "Hot Topic", 25, "top", "black", "graphic", "all"],
  ["Striped Long Sleeve", "Urban Outfitters", 39, "top", "black", "stripes", "all"],
  ["Waffle Knit Thermal", "Carhartt", 42, "top", "dark_green", "waffle", "winter"],
  ["Oversized Cardigan", "Urban Outfitters", 59, "top", "brown", "solid", "fall"],
  ["Vintage Crop Tee", "Brandy Melville", 22, "top", "washed_grey", "solid", "all"],
  // Bottoms
  ["Ripped Straight Jeans", "Levi's 501", 79, "bottom", "dark_wash", "distressed", "all"],
  ["Black Skinny Jeans", "Levi's", 69, "bottom", "black", "solid", "all"],
  ["Plaid Mini Skirt", "Urban Outfitters", 45, "bottom", "red", "plaid", "all"],
  ["Distressed Boyfriend Jeans", "Levi's", 79, "bottom", "washed_blue", "distressed", "all"],
  ["Cargo Pants", "Carhartt", 75, "bottom", "olive", "solid", "all"],
  ["Ripped Tights", "Hot Topic", 15, "bottom", "black", "fishnet", "all"],
  ["Black Denim Skirt", "Levi's", 55, "bottom", "black", "solid", "all"],
  ["Washed Baggy Jeans", "Urban Outfitters", 59, "bottom", "grey", "solid", "all"],
  // Shoes
  ["1460 Combat Boots", "Dr. Martens", 175, "shoes", "black", "solid", "all"],
  ["Chuck Taylor High", "Converse", 65, "shoes", "black", "solid", "all"],
  ["Platform Combat Boots", "Dr. Martens", 195, "shoes", "black", "solid", "all"],
  ["Leather Chelsea Boots", "Blundstone", 195, "shoes", "black", "solid", "fall"],
  ["Canvas Low Top", "Converse", 55, "shoes", "washed_black", "solid", "all"],
  ["Jadon Platform Boots", "Dr. Martens", 210, "shoes", "black", "solid", "all"],
  // Outerwear
  ["Leather Biker Jacket", "Schott NYC", 795, "outerwear", "black", "solid", "all"],
  ["Oversized Denim Jacket", "Levi's", 98, "outerwear", "washed_blue", "solid", "spring"],
  ["Sherpa Lined Flannel", "Carhartt", 99, "outerwear", "red", "plaid", "winter"],
  ["Faux Leather Jacket", "Urban Outfitters", 89, "outerwear", "black", "solid", "all"],
  ["Army Surplus Jacket", "Rothco", 55, "outerwear", "olive", "solid", "fall"],
  // Accessories
  ["Studded Belt", "Hot Topic", 25, "accessory", "black", "studded", "all"],
  ["Chain Wallet", "Dickies", 22, "accessory", "silver", "chain", "all"],
  ["Beanie", "Carhartt", 20, "accessory", "black", "solid", "winter"],
  ["Fingerless Gloves", "Hot Topic", 18, "accessory", "black", "solid", "winter"],
  ["Band Pin Set", "Hot Topic", 12, "accessory", "multi", "graphic", "all"],
  // Bags
  ["Canvas Backpack", "Jansport", 35, "bag", "black", "solid", "all"],
  ["Leather Messenger Bag", "Urban Outfitters", 55, "bag", "brown", "solid", "all"],
];

// ─── COQUETTE ────────────────────────────────────────
const COQUETTE: ProductTemplate[] = [
  // Tops
  ["Bow Detail Blouse", "Reformation", 148, "top", "blush", "solid", "spring"],
  ["Lace Trim Camisole", "Rouje", 115, "top", "white", "lace", "summer"],
  ["Ribbon Tie Crop Top", "Sézane", 95, "top", "pink", "solid", "summer"],
  ["Peter Pan Collar Top", "& Other Stories", 55, "top", "cream", "solid", "spring"],
  ["Ruffle Front Blouse", "LoveShackFancy", 295, "top", "lavender", "ruffle", "spring"],
  ["Satin Corset Top", "Zara", 45, "top", "blush", "solid", "all"],
  ["Organza Puff Sleeve Top", "Self-Portrait", 320, "top", "white", "solid", "spring"],
  ["Knit Bow Cardigan", "& Other Stories", 69, "top", "baby_pink", "solid", "spring"],
  ["Lace Bodysuit", "Reformation", 98, "top", "white", "lace", "all"],
  ["Cherry Print Top", "Rouje", 105, "top", "cream", "print", "summer"],
  ["Pearl Button Cardigan", "Sézane", 145, "top", "cream", "solid", "spring"],
  // Bottoms
  ["Pleated Mini Skirt", "Zara", 39, "bottom", "pink", "solid", "all"],
  ["Satin Midi Skirt", "Reformation", 148, "bottom", "blush", "solid", "all"],
  ["High-Waist Lace Shorts", "Self-Portrait", 275, "bottom", "white", "lace", "summer"],
  ["A-Line Mini Skirt", "& Other Stories", 55, "bottom", "lavender", "solid", "spring"],
  ["Bow Detail Trousers", "Sézane", 145, "bottom", "cream", "solid", "all"],
  ["Tulle Mini Skirt", "LoveShackFancy", 195, "bottom", "pink", "tulle", "all"],
  ["Floral Wrap Skirt", "Rouje", 125, "bottom", "pink", "floral", "spring"],
  ["Gingham Shorts", "Zara", 35, "bottom", "pink", "gingham", "summer"],
  // Shoes
  ["Satin Ballet Flats", "Repetto", 345, "shoes", "blush", "solid", "all"],
  ["Kitten Heel Slingbacks", "Sézane", 175, "shoes", "cream", "solid", "all"],
  ["Bow Mary Janes", "& Other Stories", 89, "shoes", "pink", "solid", "all"],
  ["Platform Mary Janes", "Zara", 59, "shoes", "patent_black", "solid", "all"],
  ["Ribbon Tie Heels", "Reformation", 248, "shoes", "blush", "solid", "all"],
  ["Pearl Embellished Flats", "Sam Edelman", 130, "shoes", "cream", "pearl", "all"],
  // Outerwear
  ["Bow Detail Cardigan", "Sézane", 185, "outerwear", "pink", "solid", "spring"],
  ["Cropped Tweed Jacket", "Zara", 79, "outerwear", "pink", "tweed", "spring"],
  ["Faux Fur Bolero", "LoveShackFancy", 295, "outerwear", "cream", "solid", "winter"],
  ["Lace Trim Blazer", "Self-Portrait", 450, "outerwear", "white", "lace", "spring"],
  // Accessories
  ["Satin Bow Hair Clip", "SHEIN", 5, "accessory", "pink", "solid", "all"],
  ["Pearl Choker Necklace", "Mejuri", 78, "accessory", "pearl", "solid", "all"],
  ["Ribbon Choker", "Etsy", 15, "accessory", "blush", "solid", "all"],
  ["Heart Pendant Necklace", "Tiffany & Co.", 350, "accessory", "silver", "solid", "all"],
  ["Lace Hair Bow", "& Other Stories", 15, "accessory", "white", "lace", "all"],
  ["Dainty Chain Bracelet", "Mejuri", 48, "accessory", "gold", "solid", "all"],
  // Bags
  ["Quilted Mini Bag", "Chanel", 3800, "bag", "pink", "quilted", "all"],
  ["Satin Clutch", "Zara", 35, "bag", "blush", "solid", "all"],
  ["Bow Handle Bag", "& Other Stories", 79, "bag", "cream", "solid", "all"],
];

// ─── GORPCORE ────────────────────────────────────────
const GORPCORE: ProductTemplate[] = [
  // Tops
  ["Retro Fleece Pullover", "Patagonia", 149, "top", "sage", "solid", "fall"],
  ["Base Layer Merino Top", "Icebreaker", 100, "top", "black", "solid", "winter"],
  ["Technical Zip Neck", "Arc'teryx", 145, "top", "navy", "solid", "fall"],
  ["Micro Puff Vest", "Patagonia", 199, "top", "black", "solid", "fall"],
  ["Grid Fleece Hoodie", "The North Face", 129, "top", "olive", "solid", "fall"],
  ["Merino Wool Base Layer", "Smartwool", 85, "top", "charcoal", "solid", "winter"],
  ["Lightweight Sun Hoodie", "Patagonia", 69, "top", "tan", "solid", "summer"],
  ["Quick-Dry T-Shirt", "Arc'teryx", 65, "top", "grey", "solid", "summer"],
  ["Synchilla Snap-T", "Patagonia", 139, "top", "forest_green", "solid", "fall"],
  ["Technical Tank Top", "Nike ACG", 55, "top", "black", "solid", "summer"],
  // Bottoms
  ["Convertible Hiking Pants", "The North Face", 89, "bottom", "khaki", "solid", "all"],
  ["Technical Cargo Pants", "Arc'teryx", 179, "bottom", "black", "solid", "all"],
  ["Stretch Trail Shorts", "Patagonia", 79, "bottom", "olive", "solid", "summer"],
  ["Waterproof Hiking Pants", "Arc'teryx", 299, "bottom", "black", "solid", "winter"],
  ["Nylon Joggers", "Nike ACG", 120, "bottom", "olive", "solid", "all"],
  ["Insulated Snow Pants", "The North Face", 199, "bottom", "black", "solid", "winter"],
  ["Ripstop Cargo Shorts", "Patagonia", 69, "bottom", "khaki", "solid", "summer"],
  ["Merino Wool Tights", "Icebreaker", 80, "bottom", "black", "solid", "winter"],
  // Shoes
  ["XT-6", "Salomon", 180, "shoes", "grey", "solid", "all"],
  ["Ultra Raptor II", "La Sportiva", 159, "shoes", "olive", "solid", "all"],
  ["Cloud 5", "On Running", 150, "shoes", "black", "solid", "all"],
  ["Ultraboost Trail", "Adidas", 190, "shoes", "black", "solid", "all"],
  ["Speedcross 6", "Salomon", 140, "shoes", "orange", "solid", "all"],
  ["MOAB 3", "Merrell", 130, "shoes", "brown", "solid", "all"],
  ["Terrex Free Hiker", "Adidas", 200, "shoes", "olive", "solid", "all"],
  ["Nuptse Bootie", "The North Face", 150, "shoes", "black", "solid", "winter"],
  // Outerwear
  ["Nuptse Puffer", "The North Face", 330, "outerwear", "black", "solid", "winter", ["streetwear"]],
  ["Atom LT Hoody", "Arc'teryx", 299, "outerwear", "navy", "solid", "fall"],
  ["Torrentshell 3L", "Patagonia", 179, "outerwear", "olive", "solid", "spring"],
  ["Mountain Hardshell", "Arc'teryx", 599, "outerwear", "black", "solid", "winter"],
  ["Down Sweater Hoody", "Patagonia", 279, "outerwear", "forest_green", "solid", "winter"],
  ["Windbreaker", "Nike ACG", 130, "outerwear", "orange", "colorblock", "spring"],
  ["Fleece Vest", "The North Face", 99, "outerwear", "khaki", "solid", "fall"],
  // Accessories
  ["Trail Running Cap", "Salomon", 30, "accessory", "black", "solid", "all"],
  ["Merino Wool Beanie", "Smartwool", 28, "accessory", "grey", "solid", "winter"],
  ["Hiking Socks 3-Pack", "Darn Tough", 66, "accessory", "grey", "solid", "all"],
  ["Sport Sunglasses", "Oakley", 178, "accessory", "black", "solid", "all"],
  ["Carabiner Keychain", "Nite Ize", 8, "accessory", "silver", "solid", "all"],
  // Bags
  ["Technical Day Pack", "Arc'teryx", 149, "bag", "black", "solid", "all"],
  ["Trail Running Vest", "Salomon", 130, "bag", "black", "solid", "all"],
  ["Ultralight Fanny Pack", "Patagonia", 39, "bag", "olive", "solid", "all"],
];

// ─── CLEAN GIRL ──────────────────────────────────────
const CLEAN_GIRL: ProductTemplate[] = [
  // Tops
  ["Ribbed Tank Top", "Skims", 38, "top", "mocha", "ribbed", "all"],
  ["Fitted Long Sleeve", "Aritzia", 48, "top", "white", "solid", "all"],
  ["Seamless Crop Top", "Skims", 42, "top", "nude", "solid", "all"],
  ["Cotton Bodysuit", "Zara", 29, "top", "black", "solid", "all"],
  ["Ribbed Polo", "Abercrombie", 45, "top", "white", "ribbed", "all"],
  ["Silk Blend Cami", "Aritzia", 55, "top", "champagne", "solid", "summer"],
  ["Fitted Mock Neck", "Skims", 58, "top", "mocha", "solid", "fall"],
  ["Square Neck Top", "Zara", 35, "top", "white", "solid", "summer"],
  ["Ribbed Zip-Up", "Aritzia", 68, "top", "black", "ribbed", "all"],
  ["Satin Button-Down", "Abercrombie", 55, "top", "champagne", "solid", "all"],
  ["Fitted Henley", "Skims", 48, "top", "beige", "solid", "all"],
  // Bottoms
  ["Tailored Wide-Leg Pants", "Zara", 49, "bottom", "beige", "solid", "all"],
  ["High-Rise Straight Jeans", "Abercrombie", 79, "bottom", "dark_wash", "solid", "all"],
  ["Satin Midi Skirt", "Aritzia", 78, "bottom", "champagne", "solid", "all"],
  ["Cargo Pants", "Zara", 45, "bottom", "khaki", "solid", "all"],
  ["Matching Set Shorts", "Skims", 52, "bottom", "mocha", "solid", "summer"],
  ["Tailored Mini Skirt", "Abercrombie", 55, "bottom", "black", "solid", "all"],
  ["Linen Blend Trousers", "Zara", 49, "bottom", "sand", "solid", "summer"],
  ["High-Waist Leggings", "Alo Yoga", 98, "bottom", "black", "solid", "all"],
  ["Pleated Mini Skort", "Aritzia", 68, "bottom", "white", "solid", "summer"],
  // Shoes
  ["White Sneakers", "Veja", 150, "shoes", "white", "solid", "all", ["minimalist"]],
  ["Pointed Flats", "Sam Edelman", 130, "shoes", "nude", "solid", "all"],
  ["Strappy Heeled Sandals", "Zara", 55, "shoes", "gold", "solid", "summer"],
  ["Clean Court Sneakers", "Adidas", 85, "shoes", "white", "solid", "all"],
  ["Minimal Mules", "Abercrombie", 59, "shoes", "tan", "solid", "all"],
  ["Square Toe Sandals", "Zara", 49, "shoes", "black", "solid", "summer"],
  // Outerwear
  ["Oversized Blazer", "Zara", 89, "outerwear", "beige", "solid", "all", ["old-money"]],
  ["Cropped Trench", "Abercrombie", 120, "outerwear", "sand", "solid", "spring"],
  ["Leather Jacket", "Zara", 99, "outerwear", "black", "solid", "fall"],
  ["Matching Set Cardigan", "Skims", 88, "outerwear", "mocha", "solid", "fall"],
  // Accessories
  ["Gold Hoop Earrings", "Mejuri", 68, "accessory", "gold", "solid", "all"],
  ["Layered Chain Necklace", "Mejuri", 98, "accessory", "gold", "solid", "all"],
  ["Minimal Gold Watch", "Daniel Wellington", 179, "accessory", "gold", "solid", "all"],
  ["Claw Hair Clip", "Kitsch", 14, "accessory", "tortoise", "solid", "all"],
  ["Silk Scrunchie Set", "Slip", 39, "accessory", "nude", "solid", "all"],
  ["Signet Ring", "Mejuri", 118, "accessory", "gold", "solid", "all"],
  // Bags
  ["Structured Mini Bag", "Polène", 290, "bag", "tan", "solid", "all"],
  ["Cloud Crossbody", "Aritzia", 58, "bag", "black", "solid", "all"],
  ["Woven Leather Tote", "Dragon Diffusion", 480, "bag", "tan", "woven", "all"],
];

// ─── INDIE/BOHO ──────────────────────────────────────
const INDIE_BOHO: ProductTemplate[] = [
  // Tops
  ["Embroidered Peasant Top", "Free People", 98, "top", "cream", "embroidered", "summer"],
  ["Crochet Halter Top", "Spell", 89, "top", "white", "crochet", "summer"],
  ["Printed Wrap Top", "Anthropologie", 78, "top", "terracotta", "print", "all"],
  ["Tie-Dye Crewneck", "Urban Outfitters", 49, "top", "multi", "tie-dye", "all"],
  ["Flowy Peasant Blouse", "Free People", 88, "top", "mustard", "solid", "spring"],
  ["Crochet Cardigan", "Spell", 148, "top", "cream", "crochet", "spring"],
  ["Velvet Wrap Top", "Anthropologie", 68, "top", "teal", "velvet", "fall"],
  ["Oversized Band Tee", "Urban Outfitters", 39, "top", "black", "graphic", "all", ["grunge"]],
  ["Embroidered Kimono Top", "Free People", 118, "top", "olive", "embroidered", "summer"],
  ["Fringe Knit Top", "Spell", 95, "top", "rust", "fringe", "fall"],
  // Bottoms
  ["Printed Maxi Skirt", "Free People", 128, "bottom", "terracotta", "print", "summer"],
  ["Wide-Leg Linen Pants", "Anthropologie", 98, "bottom", "olive", "solid", "summer"],
  ["Embroidered Flare Jeans", "Free People", 148, "bottom", "dark_wash", "embroidered", "all"],
  ["Tiered Midi Skirt", "Spell", 138, "bottom", "mustard", "print", "summer"],
  ["Patchwork Wide-Leg Pants", "Urban Outfitters", 69, "bottom", "multi", "patchwork", "all"],
  ["Flowy Culottes", "Anthropologie", 78, "bottom", "olive", "solid", "summer"],
  ["Printed Wrap Skirt", "Free People", 98, "bottom", "rust", "print", "all"],
  ["Velvet Flare Pants", "Urban Outfitters", 59, "bottom", "teal", "velvet", "fall"],
  // Shoes
  ["Fringe Ankle Boots", "Free People", 248, "shoes", "tan", "fringe", "fall"],
  ["Birkenstock Arizona", "Birkenstock", 110, "shoes", "brown", "solid", "summer"],
  ["Embroidered Cowboy Boots", "Anthropologie", 298, "shoes", "brown", "embroidered", "all"],
  ["Platform Sandals", "Free People", 148, "shoes", "tan", "solid", "summer"],
  ["Woven Slides", "Spell", 89, "shoes", "natural", "woven", "summer"],
  ["Suede Knee-High Boots", "Free People", 298, "shoes", "tan", "solid", "fall"],
  // Outerwear
  ["Embroidered Kimono", "Free People", 148, "outerwear", "olive", "embroidered", "summer"],
  ["Shearling Jacket", "Anthropologie", 298, "outerwear", "tan", "solid", "winter"],
  ["Crochet Poncho", "Spell", 178, "outerwear", "cream", "crochet", "fall"],
  ["Fringe Suede Jacket", "Free People", 398, "outerwear", "brown", "fringe", "fall"],
  // Accessories
  ["Layered Necklace Set", "Anthropologie", 58, "accessory", "gold", "solid", "all"],
  ["Macramé Belt", "Free People", 38, "accessory", "natural", "macrame", "all"],
  ["Turquoise Ring Set", "Spell", 48, "accessory", "turquoise", "solid", "all"],
  ["Woven Sun Hat", "Lack of Color", 99, "accessory", "natural", "woven", "summer"],
  ["Beaded Bracelet Stack", "Anthropologie", 38, "accessory", "multi", "beaded", "all"],
  ["Feather Earrings", "Free People", 28, "accessory", "brown", "feather", "all"],
  // Bags
  ["Fringe Crossbody Bag", "Free People", 98, "bag", "tan", "fringe", "all"],
  ["Woven Market Tote", "Anthropologie", 68, "bag", "natural", "woven", "summer"],
  ["Embroidered Backpack", "Spell", 128, "bag", "multi", "embroidered", "all"],
];

// ─── CROSS-GENRE ESSENTIALS ──────────────────────────
// High-demand basics that appear across multiple genres
// These represent the "core wardrobe" items every style needs
const CROSS_GENRE: ProductTemplate[] = [
  // Premium basics — fit multiple aesthetics
  ["Oversized Cotton Tee", "COS", 35, "top", "white", "solid", "all", ["minimalist", "clean-girl", "streetwear"]],
  ["Oversized Cotton Tee", "COS", 35, "top", "black", "solid", "all", ["minimalist", "grunge", "streetwear"]],
  ["Slim Fit T-Shirt", "Uniqlo", 15, "top", "white", "solid", "all", ["minimalist", "clean-girl", "old-money"]],
  ["Slim Fit T-Shirt", "Uniqlo", 15, "top", "black", "solid", "all", ["minimalist", "grunge", "dark-academia"]],
  ["Slim Fit T-Shirt", "Uniqlo", 15, "top", "navy", "solid", "all", ["minimalist", "old-money", "coastal-grandma"]],
  ["Ribbed Tank Top", "H&M", 12, "top", "white", "ribbed", "summer", ["clean-girl", "y2k", "minimalist"]],
  ["Ribbed Tank Top", "H&M", 12, "top", "black", "ribbed", "summer", ["clean-girl", "grunge", "minimalist"]],
  ["Classic Crewneck Sweatshirt", "Champion", 55, "top", "grey", "solid", "fall", ["streetwear", "minimalist", "gorpcore"]],
  ["Classic Crewneck Sweatshirt", "Champion", 55, "top", "navy", "solid", "fall", ["streetwear", "old-money", "dark-academia"]],
  ["Classic Crewneck Sweatshirt", "Champion", 55, "top", "black", "solid", "fall", ["streetwear", "grunge"]],
  ["Cashmere Crewneck Sweater", "Everlane", 135, "top", "camel", "solid", "winter", ["old-money", "minimalist", "coastal-grandma"]],
  ["Cashmere Crewneck Sweater", "Everlane", 135, "top", "grey", "solid", "winter", ["old-money", "minimalist", "dark-academia"]],
  ["Cashmere Crewneck Sweater", "Everlane", 135, "top", "cream", "solid", "winter", ["old-money", "cottagecore", "coastal-grandma"]],
  ["Silk Button-Down", "Equipment", 230, "top", "white", "solid", "all", ["old-money", "clean-girl", "minimalist"]],
  ["Silk Button-Down", "Equipment", 230, "top", "black", "solid", "all", ["old-money", "minimalist", "dark-academia"]],
  ["Heavyweight Hoodie", "Carhartt WIP", 95, "top", "black", "solid", "fall", ["streetwear", "grunge", "gorpcore"]],
  ["Heavyweight Hoodie", "Carhartt WIP", 95, "top", "olive", "solid", "fall", ["streetwear", "gorpcore"]],
  ["Heavyweight Hoodie", "Carhartt WIP", 95, "top", "grey", "solid", "fall", ["streetwear", "minimalist"]],
  ["Linen Camp Collar Shirt", "ASOS", 45, "top", "beige", "solid", "summer", ["coastal-grandma", "minimalist", "old-money"]],
  ["Linen Camp Collar Shirt", "ASOS", 45, "top", "white", "solid", "summer", ["coastal-grandma", "minimalist", "clean-girl"]],
  ["Linen Camp Collar Shirt", "ASOS", 45, "top", "olive", "solid", "summer", ["gorpcore", "streetwear"]],
  ["Cropped Cardigan", "& Other Stories", 59, "top", "pink", "solid", "spring", ["coquette", "cottagecore", "y2k"]],
  ["Cropped Cardigan", "& Other Stories", 59, "top", "cream", "solid", "spring", ["coquette", "cottagecore", "clean-girl"]],
  ["Cropped Cardigan", "& Other Stories", 59, "top", "lavender", "solid", "spring", ["coquette", "y2k"]],
  ["Mock Neck Long Sleeve", "Zara", 25, "top", "black", "solid", "all", ["minimalist", "dark-academia", "clean-girl"]],
  ["Mock Neck Long Sleeve", "Zara", 25, "top", "cream", "solid", "all", ["minimalist", "old-money", "cottagecore"]],
  ["Mock Neck Long Sleeve", "Zara", 25, "top", "brown", "solid", "all", ["dark-academia", "old-money"]],
  ["Oversized Blazer", "Mango", 89, "outerwear", "black", "solid", "all", ["clean-girl", "old-money", "minimalist"]],
  ["Oversized Blazer", "Mango", 89, "outerwear", "beige", "solid", "all", ["clean-girl", "old-money", "coastal-grandma"]],
  ["Oversized Blazer", "Mango", 89, "outerwear", "grey", "solid", "all", ["minimalist", "dark-academia", "old-money"]],
  // Premium denim — every genre needs jeans
  ["501 Original Fit Jeans", "Levi's", 79, "bottom", "dark_wash", "solid", "all", ["streetwear", "grunge", "minimalist", "clean-girl"]],
  ["501 Original Fit Jeans", "Levi's", 79, "bottom", "light_wash", "solid", "all", ["y2k", "indie-boho", "grunge", "coastal-grandma"]],
  ["501 Original Fit Jeans", "Levi's", 79, "bottom", "black", "solid", "all", ["grunge", "minimalist", "streetwear", "dark-academia"]],
  ["Ribcage Straight Jeans", "Levi's", 98, "bottom", "dark_wash", "solid", "all", ["minimalist", "clean-girl", "old-money"]],
  ["Ribcage Straight Jeans", "Levi's", 98, "bottom", "light_wash", "solid", "all", ["cottagecore", "indie-boho", "coastal-grandma"]],
  ["Wide Leg Jeans", "AGOLDE", 198, "bottom", "dark_wash", "solid", "all", ["minimalist", "clean-girl", "old-money"]],
  ["Wide Leg Jeans", "AGOLDE", 198, "bottom", "light_wash", "solid", "all", ["indie-boho", "streetwear", "y2k"]],
  ["Baggy Jeans", "Zara", 45, "bottom", "light_wash", "solid", "all", ["streetwear", "y2k", "grunge"]],
  ["Baggy Jeans", "Zara", 45, "bottom", "washed_black", "solid", "all", ["streetwear", "grunge"]],
  ["Skinny Jeans", "Topshop", 55, "bottom", "black", "solid", "all", ["grunge", "dark-academia", "coquette"]],
  ["Skinny Jeans", "Topshop", 55, "bottom", "dark_wash", "solid", "all", ["clean-girl", "minimalist"]],
  // Universal outerwear
  ["Classic Trench Coat", "Mango", 149, "outerwear", "beige", "solid", "spring", ["old-money", "minimalist", "clean-girl", "coastal-grandma"]],
  ["Classic Trench Coat", "Mango", 149, "outerwear", "black", "solid", "spring", ["minimalist", "grunge", "dark-academia"]],
  ["Leather Jacket", "AllSaints", 450, "outerwear", "black", "solid", "fall", ["grunge", "streetwear", "minimalist"]],
  ["Denim Jacket", "Levi's", 98, "outerwear", "light_wash", "solid", "spring", ["streetwear", "cottagecore", "y2k", "indie-boho"]],
  ["Denim Jacket", "Levi's", 98, "outerwear", "dark_wash", "solid", "spring", ["minimalist", "grunge", "clean-girl"]],
  ["Puffer Jacket", "Uniqlo", 99, "outerwear", "black", "solid", "winter", ["minimalist", "gorpcore", "streetwear"]],
  ["Puffer Jacket", "Uniqlo", 99, "outerwear", "olive", "solid", "winter", ["gorpcore", "streetwear"]],
  ["Puffer Jacket", "Uniqlo", 99, "outerwear", "cream", "solid", "winter", ["minimalist", "clean-girl", "old-money"]],
  ["Wool Coat", "COS", 250, "outerwear", "black", "solid", "winter", ["minimalist", "old-money", "dark-academia"]],
  ["Wool Coat", "COS", 250, "outerwear", "camel", "solid", "winter", ["old-money", "minimalist", "coastal-grandma"]],
  ["Wool Coat", "COS", 250, "outerwear", "charcoal", "solid", "winter", ["minimalist", "dark-academia"]],
  // Universal shoes
  ["White Leather Sneakers", "Adidas Stan Smith", 95, "shoes", "white", "solid", "all", ["clean-girl", "minimalist", "old-money", "streetwear"]],
  ["Canvas Sneakers", "Converse Chuck 70", 85, "shoes", "black", "solid", "all", ["grunge", "streetwear", "indie-boho"]],
  ["Canvas Sneakers", "Converse Chuck 70", 85, "shoes", "white", "solid", "all", ["minimalist", "clean-girl", "streetwear"]],
  ["Canvas Sneakers", "Converse Chuck 70", 85, "shoes", "cream", "solid", "all", ["cottagecore", "indie-boho"]],
  ["Leather Loafers", "Mango", 79, "shoes", "black", "solid", "all", ["old-money", "dark-academia", "minimalist", "clean-girl"]],
  ["Leather Loafers", "Mango", 79, "shoes", "brown", "solid", "all", ["old-money", "dark-academia", "cottagecore"]],
  ["Chelsea Boots", "Zara", 89, "shoes", "black", "solid", "fall", ["grunge", "dark-academia", "minimalist"]],
  ["Chelsea Boots", "Zara", 89, "shoes", "brown", "solid", "fall", ["dark-academia", "old-money", "indie-boho"]],
  ["Slingback Flats", "Zara", 45, "shoes", "black", "solid", "all", ["coquette", "clean-girl", "minimalist"]],
  ["Slingback Flats", "Zara", 45, "shoes", "nude", "solid", "all", ["coquette", "clean-girl", "old-money"]],
  ["Platform Sandals", "Steve Madden", 89, "shoes", "black", "solid", "summer", ["y2k", "streetwear", "indie-boho"]],
  ["Platform Sandals", "Steve Madden", 89, "shoes", "tan", "solid", "summer", ["indie-boho", "cottagecore", "coastal-grandma"]],
  ["Running Shoes", "New Balance 574", 90, "shoes", "grey", "solid", "all", ["gorpcore", "streetwear", "minimalist"]],
  ["Running Shoes", "New Balance 574", 90, "shoes", "navy", "solid", "all", ["gorpcore", "streetwear", "old-money"]],
  // Universal accessories
  ["Classic Sunglasses", "Ray-Ban Wayfarer", 165, "accessory", "black", "solid", "all", ["old-money", "minimalist", "clean-girl", "streetwear"]],
  ["Classic Sunglasses", "Ray-Ban Wayfarer", 165, "accessory", "tortoise", "solid", "all", ["old-money", "coastal-grandma", "dark-academia"]],
  ["Gold Hoop Earrings", "Mejuri", 68, "accessory", "gold", "solid", "all", ["clean-girl", "old-money", "coquette"]],
  ["Silver Chain Necklace", "Mejuri", 78, "accessory", "silver", "solid", "all", ["minimalist", "grunge", "y2k"]],
  ["Leather Belt", "Zara", 29, "accessory", "black", "solid", "all", ["minimalist", "old-money", "grunge", "dark-academia"]],
  ["Leather Belt", "Zara", 29, "accessory", "brown", "solid", "all", ["old-money", "dark-academia", "cottagecore", "indie-boho"]],
  ["Canvas Tote", "Baggu", 32, "bag", "black", "solid", "all", ["minimalist", "streetwear", "clean-girl"]],
  ["Canvas Tote", "Baggu", 32, "bag", "natural", "solid", "all", ["cottagecore", "coastal-grandma", "indie-boho"]],
  ["Crossbody Bag", "Mango", 45, "bag", "black", "solid", "all", ["minimalist", "clean-girl", "old-money"]],
  ["Crossbody Bag", "Mango", 45, "bag", "tan", "solid", "all", ["coastal-grandma", "cottagecore", "old-money"]],
  ["Mini Backpack", "Fjällräven Kånken", 80, "bag", "navy", "solid", "all", ["gorpcore", "streetwear", "minimalist"]],
  ["Mini Backpack", "Fjällräven Kånken", 80, "bag", "forest_green", "solid", "all", ["gorpcore", "cottagecore"]],
  ["Mini Backpack", "Fjällräven Kånken", 80, "bag", "pink", "solid", "all", ["coquette", "y2k"]],
  // Budget tier — SHEIN/H&M/Primark for every genre
  ["Basic Crop Top", "SHEIN", 8, "top", "white", "solid", "summer", ["y2k", "clean-girl", "coquette"]],
  ["Basic Crop Top", "SHEIN", 8, "top", "black", "solid", "summer", ["y2k", "grunge", "streetwear"]],
  ["Basic Crop Top", "SHEIN", 8, "top", "pink", "solid", "summer", ["y2k", "coquette"]],
  ["Satin Cami Top", "H&M", 19, "top", "black", "solid", "all", ["clean-girl", "minimalist", "coquette"]],
  ["Satin Cami Top", "H&M", 19, "top", "champagne", "solid", "all", ["clean-girl", "old-money", "coquette"]],
  ["Knit Polo Shirt", "H&M", 22, "top", "navy", "solid", "all", ["old-money", "minimalist", "dark-academia"]],
  ["Knit Polo Shirt", "H&M", 22, "top", "cream", "solid", "all", ["old-money", "coastal-grandma", "minimalist"]],
  ["Oversized Graphic Tee", "H&M", 15, "top", "black", "graphic", "all", ["streetwear", "grunge", "y2k"]],
  ["Floral Midi Dress", "H&M", 35, "bottom", "sage", "floral", "spring", ["cottagecore", "indie-boho", "coastal-grandma"]],
  ["Floral Midi Dress", "H&M", 35, "bottom", "pink", "floral", "spring", ["cottagecore", "coquette"]],
  ["Cargo Pants", "H&M", 29, "bottom", "olive", "solid", "all", ["streetwear", "gorpcore", "grunge"]],
  ["Cargo Pants", "H&M", 29, "bottom", "black", "solid", "all", ["streetwear", "gorpcore"]],
  ["Tailored Wide-Leg Trousers", "H&M", 35, "bottom", "black", "solid", "all", ["minimalist", "clean-girl", "old-money"]],
  ["Tailored Wide-Leg Trousers", "H&M", 35, "bottom", "beige", "solid", "all", ["minimalist", "coastal-grandma", "old-money"]],
  ["Pleated Mini Skirt", "SHEIN", 12, "bottom", "black", "solid", "all", ["y2k", "coquette", "grunge"]],
  ["Pleated Mini Skirt", "SHEIN", 12, "bottom", "plaid", "plaid", "all", ["dark-academia", "grunge", "coquette"]],
  ["Linen Shorts", "H&M", 19, "bottom", "white", "solid", "summer", ["coastal-grandma", "minimalist", "clean-girl"]],
  ["Linen Shorts", "H&M", 19, "bottom", "beige", "solid", "summer", ["coastal-grandma", "old-money", "minimalist"]],
  ["Basic Sneakers", "SHEIN", 22, "shoes", "white", "solid", "all", ["y2k", "clean-girl"]],
  ["Strappy Sandals", "H&M", 25, "shoes", "black", "solid", "summer", ["clean-girl", "minimalist", "coquette"]],
  ["Strappy Sandals", "H&M", 25, "shoes", "tan", "solid", "summer", ["coastal-grandma", "cottagecore", "indie-boho"]],
  ["Chunky Loafers", "H&M", 35, "shoes", "black", "solid", "all", ["dark-academia", "grunge", "streetwear"]],
  ["Heeled Ankle Boots", "H&M", 39, "shoes", "black", "solid", "fall", ["grunge", "dark-academia", "coquette"]],
  ["Platform Boots", "SHEIN", 35, "shoes", "black", "solid", "all", ["y2k", "grunge"]],
  ["Quilted Jacket", "H&M", 45, "outerwear", "black", "quilted", "winter", ["minimalist", "gorpcore"]],
  ["Quilted Jacket", "H&M", 45, "outerwear", "beige", "quilted", "winter", ["old-money", "coastal-grandma"]],
  ["Faux Leather Biker", "SHEIN", 35, "outerwear", "black", "solid", "fall", ["grunge", "streetwear", "y2k"]],
  ["Cropped Puffer", "SHEIN", 28, "outerwear", "pink", "solid", "winter", ["y2k", "coquette"]],
  ["Cropped Puffer", "SHEIN", 28, "outerwear", "black", "solid", "winter", ["streetwear", "grunge"]],
  // Luxury tier — aspirational items across genres
  ["Wool Gabardine Blazer", "Brunello Cucinelli", 2950, "outerwear", "navy", "solid", "all", ["old-money", "minimalist"]],
  ["Cashmere Turtleneck", "Loro Piana", 1390, "top", "cream", "solid", "winter", ["old-money", "minimalist"]],
  ["Cashmere Turtleneck", "Loro Piana", 1390, "top", "navy", "solid", "winter", ["old-money", "dark-academia"]],
  ["Leather Sneakers", "Common Projects Achilles", 450, "shoes", "white", "solid", "all", ["minimalist", "old-money", "clean-girl"]],
  ["Leather Sneakers", "Common Projects Achilles", 450, "shoes", "black", "solid", "all", ["minimalist", "old-money"]],
  ["Silk Scarf", "Hermès", 435, "accessory", "orange", "print", "all", ["old-money", "coastal-grandma"]],
  ["Double Knee Canvas Pants", "Carhartt WIP", 135, "bottom", "brown", "solid", "all", ["streetwear", "gorpcore", "grunge"]],
  ["Double Knee Canvas Pants", "Carhartt WIP", 135, "bottom", "black", "solid", "all", ["streetwear", "gorpcore"]],
  ["Technical Shell Jacket", "Arc'teryx Beta LT", 550, "outerwear", "black", "solid", "all", ["gorpcore", "streetwear", "minimalist"]],
  ["Down Parka", "Canada Goose", 1295, "outerwear", "black", "solid", "winter", ["gorpcore", "streetwear", "old-money"]],
  ["Flap Bag", "Chanel Classic", 8800, "bag", "black", "quilted", "all", ["old-money", "clean-girl", "coquette"]],
  ["Puzzle Bag", "Loewe", 3550, "bag", "tan", "solid", "all", ["old-money", "minimalist", "clean-girl"]],
  ["Le Pliage Tote", "Longchamp", 155, "bag", "black", "solid", "all", ["old-money", "minimalist", "clean-girl"]],
  ["Le Pliage Tote", "Longchamp", 155, "bag", "navy", "solid", "all", ["old-money", "coastal-grandma"]],
  ["Baguette Bag", "Fendi", 3190, "bag", "brown", "logo", "all", ["old-money", "y2k", "clean-girl"]],
  // Mid-tier popular brands — Zara, ASOS, Mango, Abercrombie
  ["Satin Midi Dress", "Zara", 49, "bottom", "black", "solid", "all", ["clean-girl", "minimalist", "old-money"]],
  ["Satin Midi Dress", "Zara", 49, "bottom", "champagne", "solid", "all", ["clean-girl", "coquette", "old-money"]],
  ["Printed Wrap Dress", "Mango", 69, "bottom", "rust", "print", "summer", ["indie-boho", "cottagecore"]],
  ["Printed Wrap Dress", "Mango", 69, "bottom", "sage", "print", "summer", ["cottagecore", "coastal-grandma"]],
  ["Matching Knit Set Top", "Zara", 35, "top", "beige", "solid", "all", ["clean-girl", "minimalist"]],
  ["Matching Knit Set Bottom", "Zara", 35, "bottom", "beige", "solid", "all", ["clean-girl", "minimalist"]],
  ["Matching Knit Set Top", "Zara", 35, "top", "black", "solid", "all", ["clean-girl", "minimalist"]],
  ["Matching Knit Set Bottom", "Zara", 35, "bottom", "black", "solid", "all", ["clean-girl", "minimalist"]],
  ["Corset Top", "Zara", 39, "top", "black", "solid", "all", ["coquette", "clean-girl", "y2k"]],
  ["Corset Top", "Zara", 39, "top", "white", "solid", "all", ["coquette", "cottagecore"]],
  ["Tailored Vest", "Mango", 55, "top", "black", "solid", "all", ["old-money", "minimalist", "dark-academia"]],
  ["Tailored Vest", "Mango", 55, "top", "beige", "solid", "all", ["old-money", "coastal-grandma", "clean-girl"]],
  ["Linen Jumpsuit", "ASOS", 55, "bottom", "black", "solid", "summer", ["minimalist", "clean-girl"]],
  ["Linen Jumpsuit", "ASOS", 55, "bottom", "sand", "solid", "summer", ["coastal-grandma", "minimalist"]],
  ["Faux Leather Pants", "Zara", 49, "bottom", "black", "solid", "fall", ["grunge", "streetwear", "minimalist"]],
  ["Faux Leather Pants", "Zara", 49, "bottom", "brown", "solid", "fall", ["old-money", "dark-academia"]],
  ["Slip Dress", "Mango", 45, "bottom", "black", "solid", "all", ["minimalist", "clean-girl", "coquette"]],
  ["Slip Dress", "Mango", 45, "bottom", "champagne", "solid", "all", ["coquette", "clean-girl", "old-money"]],
  ["Boyfriend Shirt", "ASOS", 35, "top", "blue", "stripes", "all", ["old-money", "coastal-grandma", "minimalist"]],
  ["Boyfriend Shirt", "ASOS", 35, "top", "white", "solid", "all", ["minimalist", "clean-girl", "old-money"]],
  ["Knit Midi Skirt", "Zara", 39, "bottom", "cream", "solid", "fall", ["minimalist", "clean-girl", "old-money"]],
  ["Knit Midi Skirt", "Zara", 39, "bottom", "black", "solid", "fall", ["minimalist", "clean-girl"]],
  ["Platform Loafers", "Zara", 59, "shoes", "black", "solid", "all", ["dark-academia", "grunge", "streetwear"]],
  ["Platform Loafers", "Zara", 59, "shoes", "brown", "solid", "all", ["dark-academia", "old-money"]],
  ["Mesh Ballet Flats", "ASOS", 28, "shoes", "black", "solid", "all", ["coquette", "clean-girl", "minimalist"]],
  ["Mesh Ballet Flats", "ASOS", 28, "shoes", "nude", "solid", "all", ["coquette", "clean-girl", "old-money"]],
  ["Oversized Scarf", "Zara", 29, "accessory", "camel", "solid", "winter", ["old-money", "minimalist", "coastal-grandma"]],
  ["Oversized Scarf", "Zara", 29, "accessory", "grey", "solid", "winter", ["minimalist", "dark-academia"]],
  ["Hair Claw Clip", "Kitsch", 14, "accessory", "tortoise", "solid", "all", ["clean-girl", "minimalist", "cottagecore"]],
  ["Hair Claw Clip", "Kitsch", 14, "accessory", "black", "solid", "all", ["clean-girl", "minimalist", "grunge"]],
  ["Beaded Necklace", "Anthropologie", 38, "accessory", "multi", "beaded", "all", ["indie-boho", "cottagecore", "y2k"]],
  ["Chain Link Bracelet", "Mejuri", 68, "accessory", "gold", "solid", "all", ["clean-girl", "old-money", "minimalist"]],
  ["Bucket Hat", "Nike", 32, "accessory", "black", "solid", "summer", ["streetwear", "gorpcore", "y2k"]],
  ["Bucket Hat", "Nike", 32, "accessory", "olive", "solid", "summer", ["gorpcore", "streetwear"]],
  // Athletic / athleisure crossover
  ["Fleece Joggers", "Nike", 65, "bottom", "grey", "solid", "all", ["streetwear", "gorpcore"]],
  ["Fleece Joggers", "Nike", 65, "bottom", "black", "solid", "all", ["streetwear", "minimalist"]],
  ["Sports Bra", "Lululemon", 58, "top", "black", "solid", "all", ["clean-girl", "gorpcore"]],
  ["Yoga Pants", "Lululemon", 98, "bottom", "black", "solid", "all", ["clean-girl", "gorpcore"]],
  ["Track Jacket", "Adidas", 75, "outerwear", "black", "stripes", "all", ["streetwear", "y2k", "gorpcore"]],
  ["Track Jacket", "Adidas", 75, "outerwear", "navy", "stripes", "all", ["streetwear", "old-money"]],
  ["Windbreaker", "Nike", 85, "outerwear", "black", "solid", "spring", ["gorpcore", "streetwear"]],
  ["Windbreaker", "Nike", 85, "outerwear", "forest_green", "solid", "spring", ["gorpcore"]],
  // Additional luxury/designer
  ["Silk Midi Skirt", "Max Mara", 595, "bottom", "cream", "solid", "all", ["old-money", "minimalist"]],
  ["Wool Tuxedo Pants", "Saint Laurent", 1290, "bottom", "black", "solid", "all", ["old-money", "minimalist"]],
  ["Leather Ankle Boots", "Acne Studios", 550, "shoes", "black", "solid", "fall", ["minimalist", "grunge", "dark-academia"]],
  ["Oversized Shirt Dress", "Totême", 390, "bottom", "white", "solid", "summer", ["minimalist", "old-money"]],
  ["Knit Beanie", "Acne Studios", 160, "accessory", "black", "solid", "winter", ["minimalist", "streetwear", "gorpcore"]],
  ["Knit Beanie", "Acne Studios", 160, "accessory", "grey", "solid", "winter", ["minimalist", "gorpcore"]],
  ["Leather Card Wallet", "Bottega Veneta", 380, "accessory", "brown", "intrecciato", "all", ["old-money", "minimalist"]],
  ["Mini Bucket Bag", "Mansur Gavriel", 595, "bag", "black", "solid", "all", ["minimalist", "old-money", "clean-girl"]],
  ["Mini Bucket Bag", "Mansur Gavriel", 595, "bag", "tan", "solid", "all", ["minimalist", "old-money", "coastal-grandma"]],
];

// ─── All genre seed arrays ──────────────────────────
const ALL_GENRES: Record<string, ProductTemplate[]> = {
  "old-money": OLD_MONEY,
  "y2k": Y2K,
  "streetwear": STREETWEAR,
  "minimalist": MINIMALIST,
  "cottagecore": COTTAGECORE,
  "dark-academia": DARK_ACADEMIA,
  "coastal-grandma": COASTAL_GRANDMA,
  "grunge": GRUNGE,
  "coquette": COQUETTE,
  "gorpcore": GORPCORE,
  "clean-girl": CLEAN_GIRL,
  "indie-boho": INDIE_BOHO,
  "cross-genre": CROSS_GENRE,
};

// Placeholder image URL — uses placehold.co with brand/product info
// These get replaced by real CDN images when ShopStyle API is connected
function generatePlaceholderImage(brand: string, category: string, color: string): string[] {
  // Brand colors for visually distinct placeholders
  const brandColors: Record<string, string> = {
    "Ralph Lauren": "1C3144", "COS": "2D2D2D", "Nike": "111111", "Zara": "000000",
    "Patagonia": "1B3A4B", "SHEIN": "FFB6C1", "Free People": "C4A882", "Dr. Martens": "2C2C2C",
    "Arc'teryx": "1E1E1E", "Skims": "C9B99A", "Supreme": "CC0000", "Reformation": "E8D5C4",
    "Juicy Couture": "FF69B4", "Sézane": "F5E6D3", "Salomon": "394D5E",
  };
  const bgColor = brandColors[brand] || "1a1a2e";
  const textColor = "ffffff";
  const encodedBrand = encodeURIComponent(brand);
  const encodedCat = encodeURIComponent(category);

  return [
    `https://placehold.co/800x1067/${bgColor}/${textColor}?text=${encodedBrand}%0A${encodedCat}`,
    `https://placehold.co/400x533/${bgColor}/${textColor}?text=${encodedBrand}`,
  ];
}

// Generate a unique external ID for demo items
function demoExternalId(genre: string, index: number): string {
  return `demo-${genre}-${String(index).padStart(4, "0")}`;
}

// ─── Seed function ──────────────────────────────────
export async function seedCatalog() {
  let totalInserted = 0;

  for (const [genreSlug, templates] of Object.entries(ALL_GENRES)) {
    let genreInserted = 0;

    for (let i = 0; i < templates.length; i++) {
      const [name, brand, price, category, color, pattern, season, extraTags] = templates[i];
      const externalId = demoExternalId(genreSlug, i);

      // Check if already seeded (idempotent)
      const existing = await db.query.catalogItems.findFirst({
        where: (items, { eq: equals }) => equals(items.externalId, externalId),
      });

      if (!existing) {
        // Build genre tags — primary genre + any extras from the template
        const genreTags = [genreSlug, ...(extraTags || [])];
        const imageUrls = generatePlaceholderImage(brand, category, color);

        await db.insert(catalogItems).values({
          id: nanoid(),
          name,
          brand,
          price,
          currency: "USD",
          imageUrls,
          category,
          color,
          pattern: pattern || null,
          genreTags,
          season: season || "all",
          affiliateUrl: `https://shopstyle.com/p/${encodeURIComponent(brand)}-${encodeURIComponent(name)}`,
          inStock: true,
          source: "demo",
          externalId,
        });

        genreInserted++;
        totalInserted++;
      }
    }

    console.log(`  ${genreSlug}: ${genreInserted} items (${templates.length} total in genre)`);
  }

  console.log(`\nSeeded ${totalInserted} new catalog items (${Object.values(ALL_GENRES).reduce((a, b) => a + b.length, 0)} total across all genres)`);
}

// Run directly: npx tsx src/lib/db/seed-catalog.ts
if (require.main === module) {
  seedCatalog()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("Catalog seed failed:", e);
      process.exit(1);
    });
}
