"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrder = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const order_model_1 = require("./order-model");
const TABLE_NAME = process.env.ORDER_TABLE_NAME;
const client = new client_dynamodb_1.DynamoDBClient({ region: "eu-central-1" });
const ddbDocClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const getOrder = (event, key) => __awaiter(void 0, void 0, void 0, function* () {
    const [shardId, orderId] = key.split(":");
    const command = new lib_dynamodb_1.GetCommand({
        TableName: TABLE_NAME,
        Key: { shardId, orderId },
        ReturnConsumedCapacity: "TOTAL",
    });
    const response = yield ddbDocClient.send(command);
    if (!response.Item)
        return null;
    const order = order_model_1.Order.fromItem(response.Item);
    return order;
});
exports.getOrder = getOrder;
