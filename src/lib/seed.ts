import type { Product } from "@/types/inventory";

export const seedProducts: Product[] = [
  {
    id: "sku-airpods-neo",
    sku: "APN-2049",
    name: "AirPods Neo Bundle",
    category: "Consumer electronics",
    stock: 92,
    threshold: 120,
    reorderQuantity: 780,
    unitCost: 118,
    salesVelocityPerHour: 5.8,
    lastFourDayDropPct: 82,
    supplier: "Northstar Audio",
    updatedAt: new Date().toISOString()
  },
  {
    id: "sku-smart-mug",
    sku: "MUG-88C",
    name: "TempSync Smart Mug",
    category: "Home goods",
    stock: 184,
    threshold: 90,
    reorderQuantity: 360,
    unitCost: 34,
    salesVelocityPerHour: 2.1,
    lastFourDayDropPct: 38,
    supplier: "Cinder Works",
    updatedAt: new Date().toISOString()
  },
  {
    id: "sku-espresso",
    sku: "ESP-PRO",
    name: "Barista Pro Espresso Kit",
    category: "Kitchen",
    stock: 37,
    threshold: 70,
    reorderQuantity: 240,
    unitCost: 211,
    salesVelocityPerHour: 1.6,
    lastFourDayDropPct: 74,
    supplier: "Atlas Kitchen Supply",
    updatedAt: new Date().toISOString()
  },
  {
    id: "sku-powerbank",
    sku: "PWR-20K",
    name: "20K MagSafe Power Bank",
    category: "Mobile accessories",
    stock: 418,
    threshold: 160,
    reorderQuantity: 620,
    unitCost: 27,
    salesVelocityPerHour: 3.7,
    lastFourDayDropPct: 28,
    supplier: "VoltGrid",
    updatedAt: new Date().toISOString()
  },
  {
    id: "sku-carryon",
    sku: "TRV-CBN",
    name: "CabinFlex Carry-On",
    category: "Travel",
    stock: 61,
    threshold: 110,
    reorderQuantity: 310,
    unitCost: 86,
    salesVelocityPerHour: 2.9,
    lastFourDayDropPct: 88,
    supplier: "Wayline Goods",
    updatedAt: new Date().toISOString()
  }
];
