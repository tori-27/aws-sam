import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Order } from "./order-model";

const TABLE_NAME = process.env.ORDER_TABLE_NAME;

const client = new DynamoDBClient({ region: "eu-central-1" });
const ddbDocClient = DynamoDBDocumentClient.from(client);

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
