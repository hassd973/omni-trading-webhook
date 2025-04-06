import { BasicException } from '../BasicException';
import lodash from 'lodash';
export const SLEEP_MS = 1000;
/**
 * @param ms
 */
export const sleep = async (ms) => {
    return await new Promise((resolve) => setTimeout(() => {
        resolve(1);
    }, ms));
};
/**
 * @param value
 */
export const isNullOrBlank = (value) => {
    return !value || value === undefined || value === '' || value.length === 0;
};
/**
 * @param func
 * @param retryCount
 * @param sleepMS
 */
export const retry = async (func, retryCount = 3, sleepMS = SLEEP_MS) => {
    let count = retryCount;
    do {
        try {
            return await func();
        }
        catch (e) {
            if (count > 0) {
                count--;
            }
            if (count <= 0) {
                throw new BasicException(e.toString(), e);
            }
            Trace.print('retry', e);
            await sleep(sleepMS);
        }
    } while (true);
};
export function getDefaultValue(obj, path, defaultValue) {
    return lodash.get(obj, path, defaultValue) || defaultValue;
}
export function generateRandomClientId() {
    return Math.random().toString().slice(2).replace(/^0+/, '');
}
export function getPrecision(num) {
    const val = Number(num);
    if (isNaN(val)) {
        return 0;
    }
    const strList = String(num).split('.');
    return strList.length === 2 ? strList[1].length : 0;
}
export class TraceTool {
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
export const Trace = new TraceTool();
