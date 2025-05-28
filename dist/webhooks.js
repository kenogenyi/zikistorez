"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paystackWebhookHandler = void 0;
var get_payload_1 = require("./get-payload");
var resend_1 = require("resend");
var ReceiptEmail_1 = require("./components/emails/ReceiptEmail");
var resend = new resend_1.Resend(process.env.RESEND_API_KEY);
var paystackWebhookHandler = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var webhookRequest, body, signature, event, crypto_1, hash, err_1, data, payload, users, user, orders, order, emailData, error_1;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                webhookRequest = req;
                body = webhookRequest.rawBody;
                signature = req.headers['x-paystack-signature'] || '';
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('crypto')); })];
            case 2:
                crypto_1 = _c.sent();
                hash = crypto_1.createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || '')
                    .update(body.toString('utf8'))
                    .digest('hex');
                if (hash !== signature) {
                    return [2 /*return*/, res.status(400).send('Webhook Error: Invalid signature')];
                }
                event = JSON.parse(body.toString('utf8'));
                return [3 /*break*/, 4];
            case 3:
                err_1 = _c.sent();
                return [2 /*return*/, res
                        .status(400)
                        .send("Webhook Error: ".concat(err_1 instanceof Error
                        ? err_1.message
                        : 'Unknown Error'))];
            case 4:
                data = event.data;
                if (!((_a = data === null || data === void 0 ? void 0 : data.metadata) === null || _a === void 0 ? void 0 : _a.userId) ||
                    !((_b = data === null || data === void 0 ? void 0 : data.metadata) === null || _b === void 0 ? void 0 : _b.orderId)) {
                    return [2 /*return*/, res
                            .status(400)
                            .send("Webhook Error: No user present in metadata")];
                }
                if (!(event.event === 'charge.success')) return [3 /*break*/, 12];
                return [4 /*yield*/, (0, get_payload_1.getPayloadClient)()];
            case 5:
                payload = _c.sent();
                return [4 /*yield*/, payload.find({
                        collection: 'users',
                        where: {
                            id: {
                                equals: data.metadata.userId,
                            },
                        },
                    })];
            case 6:
                users = (_c.sent()).docs;
                user = users[0];
                if (!user)
                    return [2 /*return*/, res
                            .status(404)
                            .json({ error: 'No such user exists.' })];
                return [4 /*yield*/, payload.find({
                        collection: 'orders',
                        depth: 2,
                        where: {
                            id: {
                                equals: data.metadata.orderId,
                            },
                        },
                    })];
            case 7:
                orders = (_c.sent()).docs;
                order = orders[0];
                if (!order)
                    return [2 /*return*/, res
                            .status(404)
                            .json({ error: 'No such order exists.' })];
                return [4 /*yield*/, payload.update({
                        collection: 'orders',
                        data: {
                            _isPaid: true,
                        },
                        where: {
                            id: {
                                equals: data.metadata.orderId,
                            },
                        },
                    })];
            case 8:
                _c.sent();
                _c.label = 9;
            case 9:
                _c.trys.push([9, 11, , 12]);
                return [4 /*yield*/, resend.emails.send({
                        from: 'zikistore <ogenyiken@gmail.com>',
                        to: [user.email],
                        subject: 'Thanks for your order! This is your receipt.',
                        html: (0, ReceiptEmail_1.ReceiptEmailHtml)({
                            date: new Date(),
                            email: user.email,
                            orderId: data.metadata.orderId,
                            products: order.products,
                        }),
                    })];
            case 10:
                emailData = _c.sent();
                res.status(200).json({ data: emailData });
                return [3 /*break*/, 12];
            case 11:
                error_1 = _c.sent();
                res.status(500).json({ error: error_1 });
                return [3 /*break*/, 12];
            case 12: return [2 /*return*/, res.status(200).send()];
        }
    });
}); };
exports.paystackWebhookHandler = paystackWebhookHandler;
