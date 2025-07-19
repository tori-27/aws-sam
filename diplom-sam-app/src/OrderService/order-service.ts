import { getOrder as getOrderDAL } from "./order-service-dal";

export const getOrderService = async (event: any, key: string) => {
  return await getOrderDAL(event, key);
};
