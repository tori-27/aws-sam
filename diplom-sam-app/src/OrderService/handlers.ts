import { getOrderService } from "./order-service";

export const getOrderHandler = async (event: any, context: any) => {
  const key = event.pathParameters?.id;
  try {
    const order = await getOrderService(event, key);
    if (!order) return { statusCode: 404, body: "Not found" };
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
