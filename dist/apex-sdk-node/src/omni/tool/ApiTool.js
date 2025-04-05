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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiTool = void 0;
const axios_1 = __importDefault(require("axios"));
const Tool_1 = require("./Tool");
const BasicException_1 = require("./BasicException");
const debug = true;
class ApiTool {
    constructor(env) {
        this.env = env;
    }
    request(path_1, method_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (path, method, data, config = {
            headers: {},
        }) {
            return yield new Promise((resolve, reject) => {
                const requestUrl = this.env.url + path;
                const req = {
                    url: requestUrl,
                    method,
                    params: undefined,
                    data: undefined,
                    headers: {},
                };
                if (['get', 'delete'].indexOf(method.toLowerCase()) >= 0) {
                    req.params = data;
                }
                else {
                    req.data = data;
                }
                if (config.headers) {
                    req.headers = config.headers;
                }
                (0, axios_1.default)(req)
                    .then((res) => {
                    if (debug) {
                        Tool_1.Trace.debug(`request success ${method} ${requestUrl} data =`, data, `headers = `, config.headers, `result = `, res.data);
                    }
                    resolve(res.data);
                })
                    .catch((err) => {
                    if (debug) {
                        Tool_1.Trace.error(`request error ${method} ${requestUrl} data =`, data, `headers = `, config.headers, `error = `, err.message);
                    }
                    const msg = err.message || 'Network Error';
                    reject(msg);
                });
            });
        });
    }
    apiRequest(path_1, method_1) {
        return __awaiter(this, arguments, void 0, function* (path, method, data = {}, config = {
            headers: {},
        }) {
            try {
                const result = yield this.request(path, method, data, config);
                if (result.code) {
                    throw new BasicException_1.BasicException(result.msg);
                }
                return result.data;
            }
            catch (e) {
                throw new BasicException_1.BasicException(e.message || e);
            }
        });
    }
}
exports.ApiTool = ApiTool;
