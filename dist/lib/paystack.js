"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paystack = void 0;
var axios_1 = __importDefault(require("axios"));
exports.paystack = axios_1.default.create({
    baseURL: 'https://api.paystack.co',
    headers: {
        Authorization: "Bearer ".concat(process.env.PAYSTACK_SECRET_KEY),
        'Content-Type': 'application/json',
    },
});
