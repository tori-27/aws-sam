import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Tenant, TenantTier } from "./tenant-model";
import { ok, serverError } from "../shared/utils";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";

const {
  PLATINUM_TIER_API_KEY,
  PREMIUM_TIER_API_KEY,
  STANDARD_TIER_API_KEY,
  BASIC_TIER_API_KEY,
  CREATE_TENANT_ADMIN_USER_RESOURCE_PATH,
  CREATE_TENANT_RESOURCE_PATH,
  PROVISION_TENANT_RESOURCE_PATH,
  AWS_REGION,
} = process.env;

const apiKeyByTier = (tier: TenantTier): string => {
  switch (tier) {
    case "PLATINUM":
      return PLATINUM_TIER_API_KEY!;
    case "PREMIUM":
      return PREMIUM_TIER_API_KEY!;
    case "STANDARD":
      return STANDARD_TIER_API_KEY!;
    case "BASIC":
      return BASIC_TIER_API_KEY!;
  }
};

const abs = (host: string, stage: string, path: string) =>
  `https://${host}/${stage}${path}`;

const client = new DynamoDBClient({ region: "eu-central-1" });
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const registerTenant: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const stage = event.requestContext.stage!;
    const host = event.headers["host"] || event.headers["Host"]!;
    const body = JSON.parse(event.body || "{}");

    const tier = String(body.tenantTier || "BASIC").toUpperCase() as TenantTier;
    const dedicated = tier === "PLATINUM" ? "true" : "false";

    const base: Partial<Tenant> = {
      tenantId: body.tenantId,
      tenantName: body.tenantName,
      tenantAddress: body.tenantAddress,
      tenantEmail: body.tenantEmail,
      tenantPhone: body.tenantPhone,
      tenantTier: tier,
      dedicatedTenancy: dedicated,
      apiKey: apiKeyByTier(tier),
    } as any;

    const createAdminRes = await fetch(
      abs(host, stage, CREATE_TENANT_ADMIN_USER_RESOURCE_PATH!),
      {
        method: "POST",
        body: JSON.stringify(base),
        headers: { "content-type": "application/json" },
      }
    ).then((r) => r.json());

    const enriched = {
      ...base,
      userPoolId: createAdminRes?.message?.userPoolId,
      appClientId: createAdminRes?.message?.appClientId,
      tenantAdminUserName: createAdminRes?.message?.tenantAdminUserName,
    };

    await fetch(abs(host, stage, CREATE_TENANT_RESOURCE_PATH!), {
      method: "POST",
      body: JSON.stringify(enriched),
      headers: { "content-type": "application/json" },
    });

    if (dedicated === "true") {
      await fetch(abs(host, stage, PROVISION_TENANT_RESOURCE_PATH!), {
        method: "POST",
        body: JSON.stringify(enriched),
        headers: { "content-type": "application/json" },
      });
    }
    return ok("You have been registered in our system");
  } catch (e) {
    return serverError(e);
  }
};
