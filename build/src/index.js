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
require("reflect-metadata");
const path_1 = require("path");
const util_1 = require("util");
const promises_1 = require("fs/promises");
const yaml_1 = require("yaml");
const nodemailer_1 = require("nodemailer");
const runner_1 = __importDefault(require("./runner"));
const fs_1 = require("fs");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const util_2 = require("./util");
const lib_1 = require("./lib");
const argsForDisplay = (...args) => args.map(arg => {
    if (typeof arg === 'string') {
        return arg.toLowerCase();
    }
    return (0, util_1.inspect)(arg, { depth: Infinity });
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const root = yield (0, util_2.findPackageJsonDir)(__dirname);
    const configYaml = (0, yaml_1.parse)(yield (0, promises_1.readFile)((0, path_1.join)(root, 'config.yaml'), 'utf8'));
    const config = (0, class_transformer_1.plainToInstance)(lib_1.Config, configYaml);
    const logFilePath = (0, path_1.join)(root, 'logs', 'cron.log');
    const logStream = (0, fs_1.createWriteStream)(logFilePath, { flags: 'a' });
    const configErrors = yield (0, class_validator_1.validate)(config);
    const log = (level, ...args) => {
        const now = new Date();
        logStream.write(JSON.stringify({
            level,
            date: now,
            args,
        }));
        logStream.write('\n');
        console.log(`[${level} @ ${(0, util_2.dateFmt)(now)}]`, ...argsForDisplay(...args));
    };
    if (configErrors.length > 0) {
        log('error', 'config validation failed', configErrors);
        return;
    }
    log('success', 'config validation passed', config);
    const mailer = (0, nodemailer_1.createTransport)(config.smtp);
    const jobsContext = {
        log,
        mailerFrom: config.smtp.auth.user,
        mailer,
        jobs: config.jobs,
        emailNotificationsRecipients: config.emailNotificationsRecipients,
    };
    (0, runner_1.default)(jobsContext).then(() => {
        log('success', '`jobs have been scheduled, please keep this window open otherwise they will not run');
    }, err => {
        log('error', 'an error occurred in the CRONs', err);
    });
});
main().catch(err => {
    console.error('an error occurred in the CRONs,', 'it should have been caught earlier,', 'this is bad', err);
});
//# sourceMappingURL=index.js.map