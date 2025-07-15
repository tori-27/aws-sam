import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";

const addNumber = function (a: number, b: number): number {
  return a + b;
};

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  let eventBody = (() => {
    try {
      return JSON.parse(event.body ?? "{}");
    } catch {
      throw new Error("Invalid JSON");
    }
  })();
  let c = addNumber(eventBody.a, eventBody.b);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Sum = ${c}`,
      statusCode: 200,
    }),
  };
};
