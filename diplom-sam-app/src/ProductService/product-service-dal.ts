import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DeleteCommandOutput,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  TranslateConfig,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { Category, Product } from "./product-model";
import { v4 as uuidv4 } from "uuid";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const TABLE_NAME = process.env.PRODUCT_TABLE_NAME;

const client = new DynamoDBClient({ region: "eu-central-1" });

const translateConfig: TranslateConfig = {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
};

const ddbDocClient = DynamoDBDocumentClient.from(client, translateConfig);

const suffix_start = 1;
const suffix_end = 11;

export const getProduct = async (
  event: any,
  key: string
): Promise<Product | null> => {
  const [shardId, productId] = key.split(":");
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { shardId, productId },
    ReturnConsumedCapacity: "TOTAL",
  });
  const response = await ddbDocClient.send(command);
  if (!response.Item) return null;
  const product = Product.fromItem(response.Item);
  return product;
};

export const getAllProducts = async (event: any): Promise<Product[]> => {
  const command = new ScanCommand({
    TableName: TABLE_NAME,
  });
  const response = await ddbDocClient.send(command);
  if (!response.Items) {
    return [];
  }
  return response.Items.map((item) => Product.fromItem(item));
};

export const deleteProduct = async (
  event: any,
  key: string
): Promise<DeleteCommandOutput | null> => {
  const [shardId, productId] = key.split(":");
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { shardId, productId },
    ReturnValues: "ALL_OLD",
  });
  const response = await ddbDocClient.send(command);
  if (!response.Attributes) {
    return null;
  }
  return response;
};

export const updateProduct = async (
  event: any,
  payload: any,
  key: string
): Promise<Product | null> => {
  const [shardId, productId] = key.split(":");

  const updateExpression =
    "SET sku = :sku, name = :name, price = :price, category = :category";
  const expressionAttributeValues = {
    ":sku": payload.sku,
    ":name": payload.name,
    ":price": payload.price,
    ":category": payload.category,
  };
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { shardId, productId },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW",
  });
  const response = await ddbDocClient.send(command);
  if (!response.Attributes) {
    return null;
  }
  const product = Product.fromItem(response.Attributes);
  return product;
};

export const createProduct = async (
  event: any,
  payload: Product
): Promise<Product | null> => {
  const shardId = String(
    Math.floor(Math.random() * (suffix_end - suffix_start) + suffix_start)
  );
  const productId = String(uuidv4());

  const product = new Product(
    shardId,
    productId,
    payload.sku,
    payload.name,
    payload.price,
    new Category(payload.category.id, payload.category.name)
  );
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      shardId,
      productId,
      sku: product.sku,
      name: product.name,
      price: product.price,
      category: {
        id: product.category.id,
        name: product.category.name,
      },
    },
  });
  await ddbDocClient.send(command);
  return product;
};
