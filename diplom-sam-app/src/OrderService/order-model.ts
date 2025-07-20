import { unmarshall } from "@aws-sdk/util-dynamodb";

export class Order {
  public key: string;
  public orderName: string;
  public orderProducts: OrderProduct[];

  constructor(
    shardId: string,
    orderId: string,
    orderName: string,
    orderProducts: OrderProduct[]
  ) {
    this.key = `${shardId}:${orderId}`;
    this.orderName = orderName;
    this.orderProducts = orderProducts;
  }

  static fromItem(item: any): Order {
    const rawProducts = item.orderProducts || [];
    const products = rawProducts.map((prod: any) => {
      const raw = prod?.M ? unmarshall(prod.M) : prod;
      return new OrderProduct(
        raw.productId,
        Number(raw.price),
        Number(raw.quantity)
      );
    });
    return new Order(item.shardId, item.orderId, item.orderName, products);
  }
}

export class OrderProduct {
  constructor(productId: string, price: number, quantity: number) {}
}
