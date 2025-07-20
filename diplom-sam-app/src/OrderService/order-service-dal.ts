import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DeleteCommandOutput,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { Order } from "./order-model";
import { v4 as uuidv4 } from "uuid";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const TABLE_NAME = process.env.ORDER_TABLE_NAME;

const client = new DynamoDBClient({ region: "eu-central-1" });
const ddbDocClient = DynamoDBDocumentClient.from(client);

const suffix_start = 1;
const suffix_end = 11;

export const getOrder = async (
  event: any,
  key: string
): Promise<Order | null> => {
  const [shardId, orderId] = key.split(":");
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { shardId, orderId },
    ReturnConsumedCapacity: "TOTAL",
  });
  const response = await ddbDocClient.send(command);
  if (!response.Item) return null;

  const order = Order.fromItem(response.Item);

  return order;
};

export const getAllOrders = async (event: any): Promise<Order[]> => {
  const command = new ScanCommand({
    TableName: TABLE_NAME,
  });
  const response = await ddbDocClient.send(command);
  if (!response.Items) {
    return [];
  }
  const cleanItems = response.Items.map((item) => unmarshall(item));
  return cleanItems.map((item) => Order.fromItem(item));
};

export const deleteOrder = async (
  event: any,
  key: string
): Promise<DeleteCommandOutput | null> => {
  const [shardId, orderId] = key.split(":");
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { shardId, orderId },
    ReturnValues: "ALL_OLD",
  });
  const response = await ddbDocClient.send(command);
  if (!response.Attributes) {
    return null;
  }
  return response;
};

export const updateOrder = async (
  event: any,
  payload: any,
  key: string
): Promise<Order | null> => {
  const [shardId, orderId] = key.split(":");

  const updateExpression =
    "SET orderName = :orderName, orderProducts = :orderProducts";
  const expressionAttributeValues = {
    ":orderName": payload.orderName,
    ":orderProducts": payload.orderProducts,
  };
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { shardId, orderId },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW",
  });
  const response = await ddbDocClient.send(command);
  if (!response.Attributes) {
    return null;
  }
  const order = Order.fromItem(response.Attributes);
  return order;
};

export const createOrder = async (
  event: any,
  payload: Order
): Promise<Order | null> => {
  const shardId = String(
    Math.floor(Math.random() * (suffix_end - suffix_start) + suffix_start)
  );
  const orderId = String(uuidv4());

  const order = new Order(
    shardId,
    orderId,
    payload.orderName,
    payload.orderProducts
  );
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      shardId,
      orderId,
      orderName: order.orderName,
      orderProducts: order.orderProducts,
    },
  });
  await ddbDocClient.send(command);
  return order;
};
