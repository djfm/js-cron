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
exports.dateFmt = exports.findPackageJsonDir = exports.stringFromMaybeError = void 0;
const path_1 = require("path");
const promises_1 = require("fs/promises");
const stringFromMaybeError = (maybeError, defaultMessage = 'unknown error') => {
    if (!maybeError) {
        return defaultMessage;
    }
    if (maybeError instanceof Error) {
        return [
            maybeError.name,
            maybeError.message,
            maybeError.stack,
        ].join('\n');
    }
    return JSON.stringify(maybeError);
};
exports.stringFromMaybeError = stringFromMaybeError;
const findPackageJsonDir = (dir) => __awaiter(void 0, void 0, void 0, function* () {
    const candidate = (0, path_1.join)(dir, 'package.json');
    try {
        const s = yield (0, promises_1.stat)(candidate);
        if (s.isFile()) {
            return dir;
        }
    }
    catch (e) {
        const parent = (0, path_1.join)(dir, '..');
        if (parent === dir) {
            throw new Error(`Cannot find package.json in ${dir} nor any of its parents`);
        }
        return (0, exports.findPackageJsonDir)(parent);
    }
    throw new Error(`Cannot find package.json in ${dir}`);
});
exports.findPackageJsonDir = findPackageJsonDir;
const dateFmt = (date) => `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
exports.dateFmt = dateFmt;
//# sourceMappingURL=util.js.map