// src/ProductService/product-service-dal.ts
import { BaseRepo } from "../shared/base-repo";
import { randShard, parseKey } from "../shared/keys";
import { v4 as uuidv4 } from "uuid";
import { Product, Category } from "./product-model";

const TABLE_NAME = process.env.PRODUCT_TABLE_NAME!;

const repo = new BaseRepo<Product>(
  TABLE_NAME,
  { shardId: "shardId", id: "productId" },
  (raw) => Product.fromItem(raw),
  (p) => ({
    sku: p.sku,
    name: p.name,
    price: p.price,
    category: { id: p.category.id, name: p.category.name },
  })
);

export const getProduct = async (_evt: any, key: string) => {
  const { shardId, id } = parseKey(key);
  return repo.get({ shardId, productId: id });
};

export const getAllProducts = async (_evt: any) => repo.scan();

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
  _evt: any,
  payload: Omit<Product, "shardId" | "productId">
) => {
  const shardId = randShard();
  const productId = uuidv4();
  const product = new Product(
    shardId,
    productId,
    payload.sku,
    payload.name,
    payload.price,
    new Category(payload.category.id, payload.category.name)
  );
  return repo.put(product);
};
