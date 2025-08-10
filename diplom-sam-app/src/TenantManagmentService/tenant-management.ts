import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Tenant } from "./tenant-model";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_DETAILS_NAME = process.env.TENANT_DETAILS_TABLE_NAME;
const TABLE_SETTINGS_NAME = process.env.TENANT_SETTINGS_TABLE_NAME;

const client = new DynamoDBClient({ region: "eu-central-1" });
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const createTenant = async (event: any) => {
  const tenantDetails: Tenant = JSON.parse(event.body || "{}");

  let apiGatewayUrl = "";

  if (
    !tenantDetails.dedicatedTenancy ||
    String(tenantDetails.dedicatedTenancy).toLowerCase() !== "true"
  ) {
    const settingsResponse = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_SETTINGS_NAME,
        Key: { settingName: "apiGatewayUrl-Pooled" },
      })
    );
    apiGatewayUrl = settingsResponse.Item?.settingValue || "";
  } else {
    apiGatewayUrl = "";
  }

  await ddbDocClient.send(
    new PutCommand({
      TableName: TABLE_DETAILS_NAME,
      Item: {
        ...tenantDetails,
        isActive: true,
        apiGatewayUrl,
      },
    })
  );

  return {
    statusCode: 201,
    body: JSON.stringify({ message: "Tenant created" }),
  };
};
