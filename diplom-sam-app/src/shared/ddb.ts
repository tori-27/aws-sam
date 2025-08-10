import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const ddbDocClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || "eu-central-1" }),
  {
    marshallOptions: {
      convertEmptyValues: false,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
    unmarshallOptions: { wrapNumbers: false },
  }
);
