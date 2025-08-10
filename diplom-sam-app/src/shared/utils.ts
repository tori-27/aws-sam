import { APIGatewayProxyResult } from "aws-lambda";

export const ok = (body: unknown): APIGatewayProxyResult => ({
  statusCode: 200,
  body: JSON.stringify({ message: body }),
  headers: { "content-type": "application/json" },
});

export const orRaw = (body: unknown): APIGatewayProxyResult => ({
  statusCode: 200,
  body: JSON.stringify(body),
  headers: { "content-type": "application/json" },
});
