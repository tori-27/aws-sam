"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderProduct = exports.Order = void 0;
class Order {
    constructor(shardId, orderId, orderName, orderProducts) {
        this.key = `${shardId}:${orderId}`;
    }
    static fromItem(item) {
        return new Order(item.shardId, item.orderId, item.orderName, (item.orderProducts || []).map((prod) => {
            new OrderProduct(prod.productId, prod.price, prod.quantity);
        }));
    }
}
exports.Order = Order;
class OrderProduct {
    constructor(productId, price, quantity) { }
}
exports.OrderProduct = OrderProduct;
