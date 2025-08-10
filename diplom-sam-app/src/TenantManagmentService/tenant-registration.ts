import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_DETAILS_NAME = process.env.TENANT_DETAILS_TABLE_NAME;
const TABLE_SETTINGS_NAME = process.env.TENANT_SETTINGS_TABLE_NAME;

const client = new DynamoDBClient({ region: "eu-central-1" });
const ddbDocClient = DynamoDBDocumentClient.from(client);
