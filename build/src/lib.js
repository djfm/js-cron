"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = exports.Job = exports.SmtpConfig = exports.SmtpAuth = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class SmtpAuth {
    constructor() {
        this.user = '';
        this.pass = '';
    }
}
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], SmtpAuth.prototype, "user", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], SmtpAuth.prototype, "pass", void 0);
exports.SmtpAuth = SmtpAuth;
class SmtpConfig {
    constructor() {
        this.auth = new SmtpAuth();
        this.host = '';
        this.port = 0;
        this.secure = true;
    }
}
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SmtpAuth),
    __metadata("design:type", Object)
], SmtpConfig.prototype, "auth", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], SmtpConfig.prototype, "host", void 0);
__decorate([
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Object)
], SmtpConfig.prototype, "port", void 0);
exports.SmtpConfig = SmtpConfig;
class Job {
    constructor() {
        this.name = '';
        this.fullPathToExecutable = '';
        this.hour = -1;
        this.minute = -1;
        this.second = 0;
    }
}
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], Job.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], Job.prototype, "fullPathToExecutable", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(23),
    __metadata("design:type", Object)
], Job.prototype, "hour", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(59),
    __metadata("design:type", Object)
], Job.prototype, "minute", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(59),
    __metadata("design:type", Object)
], Job.prototype, "second", void 0);
exports.Job = Job;
class Config {
    constructor() {
        this.smtp = new SmtpConfig();
        this.jobs = [];
        this.emailNotificationsRecipients = [];
    }
}
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SmtpConfig),
    __metadata("design:type", Object)
], Config.prototype, "smtp", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_transformer_1.Type)(() => Job),
    __metadata("design:type", Array)
], Config.prototype, "jobs", void 0);
__decorate([
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsNotEmpty)({ each: true }),
    __metadata("design:type", Array)
], Config.prototype, "emailNotificationsRecipients", void 0);
exports.Config = Config;
//# sourceMappingURL=lib.js.map