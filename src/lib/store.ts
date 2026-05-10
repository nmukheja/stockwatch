import { connectMongo, hasMongoUri } from "@/lib/mongodb";
import { draftRestock, enrichProduct } from "@/lib/forecast";
import { seedProducts } from "@/lib/seed";
import { ProductModel } from "@/models/Product";
import { RestockDraftModel } from "@/models/RestockDraft";
import type { DashboardPayload, Product, RestockDraft } from "@/types/inventory";

let memoryProducts = [...seedProducts];
let memoryDrafts: RestockDraft[] = [];

type ProductDocument = {
  _id?: unknown;
  id?: unknown;
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
  updatedAt?: Date | string;
};

type RestockDraftDocument = {
  _id?: unknown;
  id?: unknown;
  sku: string;
  productName: string;
  quantity: number;
  supplier: string;
  urgency: number;
  message: string;
  reasoning: string;
  createdAt?: Date | string;
};

function normalizeProduct(document: ProductDocument): Product {
  return {
    id: String(document._id || document.id),
    sku: document.sku,
    name: document.name,
    category: document.category,
    stock: document.stock,
    threshold: document.threshold,
    reorderQuantity: document.reorderQuantity,
    unitCost: document.unitCost,
    salesVelocityPerHour: document.salesVelocityPerHour,
    lastFourDayDropPct: document.lastFourDayDropPct,
    supplier: document.supplier,
    updatedAt: new Date(document.updatedAt || Date.now()).toISOString()
  };
}

function normalizeDraft(document: RestockDraftDocument): RestockDraft {
  return {
    id: String(document._id || document.id),
    sku: document.sku,
    productName: document.productName,
    quantity: document.quantity,
    supplier: document.supplier,
    urgency: document.urgency,
    message: document.message,
    reasoning: document.reasoning,
    createdAt: new Date(document.createdAt || Date.now()).toISOString()
  };
}

export async function seedInventory() {
  const mongo = await connectMongo();
  if (!mongo) {
    memoryProducts = seedProducts.map((product) => ({ ...product, updatedAt: new Date().toISOString() }));
    memoryDrafts = [];
    return { dataMode: "memory" as const };
  }

  await ProductModel.deleteMany({});
  await ProductModel.insertMany(seedProducts);
  await RestockDraftModel.deleteMany({});
  return { dataMode: "mongo" as const };
}

export async function getProducts() {
  const mongo = await connectMongo();
  if (!mongo) return memoryProducts;

  const count = await ProductModel.countDocuments();
  if (count === 0) await ProductModel.insertMany(seedProducts);

  const docs = await ProductModel.find({}).sort({ sku: 1 }).lean<ProductDocument[]>();
  return docs.map(normalizeProduct);
}

export async function getDrafts() {
  const mongo = await connectMongo();
  if (!mongo) return memoryDrafts;

  const docs = await RestockDraftModel.find({}).sort({ createdAt: -1 }).limit(9).lean<RestockDraftDocument[]>();
  return docs.map(normalizeDraft);
}

export async function getDashboard(): Promise<DashboardPayload> {
  const products = (await getProducts()).map(enrichProduct).sort((a, b) => b.urgency - a.urgency);
  const drafts = await getDrafts();

  return {
    products,
    drafts,
    dataMode: hasMongoUri() ? "mongo" : "memory",
    generatedAt: new Date().toISOString()
  };
}

export async function simulateDemandShock() {
  const mongo = await connectMongo();
  if (!mongo) {
    memoryProducts = memoryProducts.map((product) => {
      if (["ATTA-10K", "HTR-BJ2K", "KURT-WF"].includes(product.sku)) {
        return {
          ...product,
          stock: Math.max(4, Math.floor(product.stock * 0.46)),
          salesVelocityPerHour: Number((product.salesVelocityPerHour * 1.55).toFixed(1)),
          lastFourDayDropPct: Math.min(96, product.lastFourDayDropPct + 9),
          updatedAt: new Date().toISOString()
        };
      }
      return product;
    });
    return generateDrafts();
  }

  await ProductModel.updateMany({ sku: { $in: ["ATTA-10K", "HTR-BJ2K", "KURT-WF"] } }, [
    {
      $set: {
        stock: { $max: [4, { $floor: { $multiply: ["$stock", 0.46] } }] },
        salesVelocityPerHour: { $round: [{ $multiply: ["$salesVelocityPerHour", 1.55] }, 1] },
        lastFourDayDropPct: { $min: [96, { $add: ["$lastFourDayDropPct", 9] }] }
      }
    }
  ]);

  return generateDrafts();
}

export async function generateDrafts() {
  const products = (await getProducts()).map(enrichProduct);
  const newDrafts = products.map(draftRestock).filter(Boolean) as RestockDraft[];
  const mongo = await connectMongo();

  if (!mongo) {
    memoryDrafts = [...newDrafts, ...memoryDrafts].slice(0, 9);
    return memoryDrafts;
  }

  for (const draft of newDrafts) {
    await RestockDraftModel.create(draft);
  }

  return getDrafts();
}
