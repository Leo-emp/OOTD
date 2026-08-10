// Abstract interface — swap ShopStyle for another source by implementing this
export interface CatalogAdapter {
  name: string;
  // Fetch products from affiliate feed — returns normalized items
  fetchProducts(params: {
    category?: string;
    genre?: string;
    limit?: number;
  }): Promise<NormalizedCatalogItem[]>;
  // Check if specific items are still in stock
  checkAvailability(externalIds: string[]): Promise<Map<string, boolean>>;
}

export interface NormalizedCatalogItem {
  externalId: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  imageUrls: string[];
  category: string;
  color: string;
  pattern?: string;
  season?: string;
  affiliateUrl: string;
}
