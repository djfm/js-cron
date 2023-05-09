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
exports.schedule = void 0;
const child_process_1 = require("child_process");
const util_1 = require("./util");
const oneHourInMs = 60 * 60 * 1000;
const oneDayInMs = 24 * oneHourInMs;
const asyncExec = (cmd) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise(resolve => {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const res = (0, child_process_1.exec)(cmd, (err, stdout, stderr) => {
            var _a;
            resolve({
                err: err !== null && err !== void 0 ? err : undefined,
                exitCode: (_a = res.exitCode) !== null && _a !== void 0 ? _a : undefined,
                stdout,
                stderr,
            });
        });
    });
});
const retryDelayMs = 5000;
const schedule = ({ jobs, log, mailer, mailerFrom, emailNotificationsRecipients: recipients }) => __awaiter(void 0, void 0, void 0, function* () {
    const makeJobRunner = (job) => () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            let attempt = 1;
            for (; attempt <= job.maxTries; ++attempt) {
                // eslint-disable-next-line no-await-in-loop
                const result = yield asyncExec(job.fullPathToExecutable);
                const now = (0, util_1.dateFmt)(new Date());
                const failed = (_a = result.err) !== null && _a !== void 0 ? _a : result.exitCode !== 0;
                if (failed && attempt < job.maxTries) {
                    log('warning', `job ${job.name} at ${now} failed, retrying in ${retryDelayMs} ms`);
                    // eslint-disable-next-line no-await-in-loop
                    yield new Promise(resolve => {
                        setTimeout(resolve, retryDelayMs);
                    });
                    continue;
                }
                const title = failed
                    ? `warning, job ${job.name} at ${now} appears to have failed`
                    : `job ${job.name} at ${now} appears to have run successfully, but check the included logs to be sure`;
                const sections = [
                    ['job name', job.name],
                    ['job path', job.fullPathToExecutable],
                    ['status', `the process exited with status ${(_b = result.exitCode) !== null && _b !== void 0 ? _b : '[unknown]'}`],
                    ['stdout', (_c = result.stdout.trim()) !== null && _c !== void 0 ? _c : '[empty]'],
                    ['stderr', (_d = result.stderr.trim()) !== null && _d !== void 0 ? _d : '[empty]'],
                ];
                if (attempt === job.maxTries && failed) {
                    sections.push(['all attempts have failed', `${attempt}/${job.maxTries}, all failed`]);
                }
                if (attempt > 1 && !failed) {
                    sections.push(['some attempts have failed', `attempt ${attempt}/${job.maxTries} succeeded`]);
                }
                if (attempt === 1) {
                    sections.push(['first attempt succeeded', `attempt ${attempt}/${job.maxTries} succeeded`]);
                }
                if (result.err) {
                    sections.push(['error', (0, util_1.stringFromMaybeError)(result.err)]);
                }
                const text = sections.map(([name, content]) => `${name}:\n${content}`).join('\n\n');
                const html = sections.map(([name, content]) => `<h2>${name}</h2><pre>${content}</pre>`).join('<p><br></p>');
                log(failed ? 'error' : 'info', title, '\n', text);
                recipients.forEach(recipient => {
                    mailer.sendMail({
                        from: mailerFrom,
                        to: recipient,
                        subject: title,
                        text,
                        html,
                    }).then(() => {
                        log('info', `successfully sent job report email for "${job.name}" to "${recipient}"`);
                    }, () => {
                        log('error', `failed to send job report email for "${job.name}" to "${recipient}"`);
                    });
                });
                if (!failed) {
                    break;
                }
            }
        }
        catch (err) {
            const messageSummary = `failed to run job ${job.name}`;
            log('error', messageSummary, err);
        }
    });
    const scheduleJob = (job) => {
        const now = new Date();
        const desiredNextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate(), job.hour, job.minute, job.second);
        const msTillFirstRun = desiredNextRun.getTime() - now.getTime();
        const firstRunTimeout = msTillFirstRun > 0
            ? msTillFirstRun
            : (msTillFirstRun + oneDayInMs);
        log('info', `scheduling job "${job.name}" to run in`, firstRunTimeout, 'ms');
        const run = makeJobRunner(job);
        setTimeout(() => {
            log('info', `running job "${job.name}" at scheduled time, then once every 24 hours`);
            run().then(() => {
                log('info', `successfully ran job "${job.name}" for the first time`);
            }, () => {
                log('error', `failed to run job "${job.name}" for the first time`);
            });
            setInterval(run, oneDayInMs);
        }, firstRunTimeout);
    };
    for (const job of jobs) {
        scheduleJob(job);
    }
});
exports.schedule = schedule;
exports.default = exports.schedule;
//# sourceMappingURL=runner.js.map