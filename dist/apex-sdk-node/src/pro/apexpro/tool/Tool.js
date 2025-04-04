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
exports.Trace = exports.TraceTool = exports.retry = exports.isNullOrBlank = exports.sleep = exports.SLEEP_MS = void 0;
exports.getDefaultValue = getDefaultValue;
exports.generateRandomClientId = generateRandomClientId;
exports.getPrecision = getPrecision;
const BasicException_1 = require("../BasicException");
const lodash_1 = __importDefault(require("lodash"));
exports.SLEEP_MS = 1000;
/**
 * @param ms
 */
const sleep = (ms) => __awaiter(void 0, void 0, void 0, function* () {
    return yield new Promise((resolve) => setTimeout(() => {
        resolve(1);
    }, ms));
});
exports.sleep = sleep;
/**
 * @param value
 */
const isNullOrBlank = (value) => {
    return !value || value === undefined || value === '' || value.length === 0;
};
exports.isNullOrBlank = isNullOrBlank;
/**
 * @param func
 * @param retryCount
 * @param sleepMS
 */
const retry = (func_1, ...args_1) => __awaiter(void 0, [func_1, ...args_1], void 0, function* (func, retryCount = 3, sleepMS = exports.SLEEP_MS) {
    let count = retryCount;
    do {
        try {
            return yield func();
        }
        catch (e) {
            if (count > 0) {
                count--;
            }
            if (count <= 0) {
                throw new BasicException_1.BasicException(e.toString(), e);
            }
            exports.Trace.print('retry', e);
            yield (0, exports.sleep)(sleepMS);
        }
    } while (true);
});
exports.retry = retry;
function getDefaultValue(obj, path, defaultValue) {
    return lodash_1.default.get(obj, path, defaultValue) || defaultValue;
}
function generateRandomClientId() {
    return Math.random().toString().slice(2).replace(/^0+/, '');
}
function getPrecision(num) {
    const val = Number(num);
    if (isNaN(val)) {
        return 0;
    }
    const strList = String(num).split('.');
    return strList.length === 2 ? strList[1].length : 0;
}
class TraceTool {
    constructor() {
        this.logShow = true;
        this.errorShow = true;
        this.debugShow = true;
    }
    setLogShow(b) {
        this.logShow = b;
    }
    setErrorShow(b) {
        this.errorShow = b;
    }
    setDebugShow(b) {
        this.debugShow = b;
    }
    log(...args) {
        // tslint:disable-next-line:no-console
        console.log(...args);
    }
    print(...args) {
        if (this.logShow) {
            this.log(...args);
        }
    }
    error(...args) {
        if (this.errorShow) {
            this.log(...args);
        }
    }
    debug(...args) {
        if (this.debugShow) {
            this.log(...args);
        }
    }
}
exports.TraceTool = TraceTool;
exports.Trace = new TraceTool();
