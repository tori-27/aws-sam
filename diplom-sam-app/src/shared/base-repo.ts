import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "./ddb";

type KeyShape = Record<string, string>;

export class BaseRepo<TItem extends Record<string, any>> {
  constructor(
    private tableName: string,
    private keyNames: KeyShape,
    private fromItem: (raw: any) => TItem,
    private toItem: (obj: TItem) => any
  ) {}

  async get(key: Record<string, string>) {
    const res = await ddbDocClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: key,
        ReturnConsumedCapacity: "TOTAL",
      })
    );
    return res.Item ? this.fromItem(res.Item) : null;
  }

  async scan(limit?: number) {
    const res = await ddbDocClient.send(
      new ScanCommand({
        TableName: this.tableName,
        Limit: limit,
      })
    );
    return (res.Items ?? []).map(this.fromItem);
  }

  async put(item: TItem) {
    await ddbDocClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: this.toItem(item),
      })
    );
    return item;
  }

  async update(key: Record<string, string>, attrs: Record<string, any>) {
    const names: Record<string, string> = {};
    const values: Record<string, any> = {};
    const sets: string[] = [];
    Object.entries(attrs).forEach(([k, v]) => {
      if (v === undefined) return;
      const nk = `#${k}`;
      const vk = `:${k}`;
      names[nk] = k;
      values[vk] = v;
      sets.push(`${nk} = ${vk}`);
    });

    if (sets.length === 0) return this.get(key);

    const res = await ddbDocClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: key,
        UpdateExpression: `SET ${sets.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      })
    );
    return res.Attributes ? this.fromItem(res.Attributes) : null;
  }

  async delete(key: Record<string, string>) {
    const res = await ddbDocClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: key,
        ReturnValues: "ALL_OLD",
      })
    );
    return res.Attributes ? this.fromItem(res.Attributes) : null;
  }

  async queryByShard(ddb: DynamoDBDocumentClient, shardId: string) {
    const r = await ddb.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "#pk = :v",
        ExpressionAttributeNames: { "#pk": "shardId" },
        ExpressionAttributeValues: { ":v": shardId },
      })
    );
    return (r.Items ?? []).map(this.fromItem);
  }
}
