export class Order {
  public key: string;

  constructor(
    shardId: string,
    orderId: string,
    orderName: string,
    orderProducts: string
  ) {
    this.key = `${shardId}:${orderId}`;
  }

  static fromItem(item: any): Order {
    return new Order(
      item.shardId,
      item.orderId,
      item.orderName,
      (item.orderProducts || []).map((prod: any) => {
        new OrderProduct(prod.productId, prod.price, prod.quantity);
      })
    );
  }
}

export class OrderProduct {
  constructor(productId: string, price: number, quantity: number) {}
}
