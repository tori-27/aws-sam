import { BaseRepo } from "../shared/base-repo";
import {
  randShard,
  parseKey,
  allShardsForTenant,
  getTenantId,
  shardForTenant,
} from "../shared/tenant";
import { v4 as uuidv4 } from "uuid";
import { Product, Category } from "./product-model";
import { ddbDocClient } from "../shared/ddb";

const TABLE_NAME = process.env.PRODUCT_TABLE_NAME!;

const repo = new BaseRepo<Product>(
  TABLE_NAME,
  { shardId: "shardId", id: "productId" },
  (raw) => Product.fromItem(raw),
  (p) => p.toItem()
);

export const getProduct = async (_evt: any, key: string) => {
  const { shardId, id } = parseKey(key);
  return repo.get({ shardId, productId: id });
};

export const getAllProducts = async (evt: any) => {
  const tenantId = getTenantId(evt);
  const shards = allShardsForTenant(tenantId, 1, 10);

  const results = await Promise.all(
    shards.map((s) => repo.queryByShard(ddbDocClient, s))
  );
  return results.flat();
};
export const deleteProduct = async (_evt: any, key: string) => {
  const { shardId, id } = parseKey(key);
  return repo.delete({ shardId, productId: id });
};

export const updateProduct = async (
  _evt: any,
  payload: Partial<Product>,
  key: string
) => {
  const { shardId, id } = parseKey(key);
  return repo.update(
    { shardId, productId: id },
    {
      sku: payload.sku,
      name: payload.name,
      price: payload.price,
      category: payload.category,
    }
  );
};

export const createProduct = async (
  evt: any,
  payload: {
    sku: string;
    name: string;
    price: number;
    category: { id: string; name: string };
  }
) => {
  const tenantId = getTenantId(evt);
  const shardId = shardForTenant(tenantId);
  const productId = uuidv4();
  const p = new Product(
    shardId,
    productId,
    payload.sku,
    payload.name,
    payload.price,
    new Category(payload.category.id, payload.category.name)
  );
  return repo.put(p);
};
