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
exports.getOrderHandler = void 0;
const order_service_1 = require("./order-service");
const getOrderHandler = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const key = (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const order = yield (0, order_service_1.getOrderService)(event, key);
        if (!order)
            return { statusCode: 404, body: "Not found" };
    }
    catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
});
exports.getOrderHandler = getOrderHandler;
