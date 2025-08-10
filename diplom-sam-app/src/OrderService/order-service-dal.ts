import { BaseRepo } from "../shared/base-repo";
import { randShard, parseKey } from "../shared/keys";
import { v4 as uuidv4 } from "uuid";
import { Order } from "./order-model";

const TABLE_NAME = process.env.ORDER_TABLE_NAME!;

const repo = new BaseRepo<Order>(
  TABLE_NAME,
  { shardId: "shardId", id: "orderId" },
  (raw) => Order.fromItem(raw),
  (o) => o.toItem()
);

export const getOrder = async (_evt: any, key: string) => {
  const { shardId, id } = parseKey(key);
  return repo.get({ shardId, orderId: id });
};

export const getAllOrders = async (_evt: any) => repo.scan();

export const deleteOrder = async (_evt: any, key: string) => {
  const { shardId, id } = parseKey(key);
  return repo.delete({ shardId, orderId: id });
};

export const updateOrder = async (
  _evt: any,
  payload: Partial<Order>,
  key: string
) => {
  const { shardId, id } = parseKey(key);
  return repo.update(
    { shardId, orderId: id },
    { orderName: payload.orderName, orderProducts: payload.orderProducts }
  );
};

export const createOrder = async (
  _evt: any,
  payload: Pick<Order, "orderName" | "orderProducts">
) => {
  const shardId = randShard();
  const orderId = uuidv4();
  const order = new Order(
    shardId,
    orderId,
    payload.orderName,
    payload.orderProducts
  );
  return repo.put(order);
};
