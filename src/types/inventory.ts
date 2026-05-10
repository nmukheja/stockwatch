export type InventoryStatus = "healthy" | "watch" | "critical";

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  threshold: number;
  reorderQuantity: number;
  unitCost: number;
  salesVelocityPerHour: number;
  lastFourDayDropPct: number;
  supplier: string;
  updatedAt: string;
};

export type ProductIntelligence = Product & {
  hoursUntilZero: number;
  status: InventoryStatus;
  urgency: number;
  reasoning: string;
};

export type RestockDraft = {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  supplier: string;
  urgency: number;
  message: string;
  reasoning: string;
  createdAt: string;
};

export type DashboardPayload = {
  products: ProductIntelligence[];
  drafts: RestockDraft[];
  dataMode: "mongo" | "memory";
  generatedAt: string;
};
