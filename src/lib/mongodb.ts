import mongoose from "mongoose";

declare global {
  var mongooseConnection: Promise<typeof mongoose> | undefined;
}

export function hasMongoUri() {
  return Boolean(process.env.MONGODB_URI);
}

export async function connectMongo() {
  if (!process.env.MONGODB_URI) return null;
  if (!global.mongooseConnection) {
    global.mongooseConnection = mongoose.connect(process.env.MONGODB_URI, {
      dbName: "stockwatch"
    });
  }
  return global.mongooseConnection;
}
