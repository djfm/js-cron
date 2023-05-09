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
const schedule = ({ jobs, log, mailer, mailerFrom, emailNotificationsRecipients: recipients }) => __awaiter(void 0, void 0, void 0, function* () {
    const makeJobRunner = (job) => () => {
        try {
            // eslint-disable-next-line @typescript-eslint/ban-types
            const result = (0, child_process_1.exec)(job.fullPathToExecutable, (err, stdout, stderr) => {
                var _a;
                const now = (0, util_1.dateFmt)(new Date());
                const title = err
                    ? `warning, job ${job.name} at ${now} appears to have failed`
                    : `job ${job.name} at ${now} appears to have run successfully, but check the included logs to be sure`;
                const sections = [
                    ['job name', job.name],
                    ['job path', job.fullPathToExecutable],
                    ['status', `the process exited with status ${(_a = result.exitCode) !== null && _a !== void 0 ? _a : '[unknown]'}`],
                    ['stdout', stdout !== null && stdout !== void 0 ? stdout : '[empty]'],
                    ['stderr', stderr !== null && stderr !== void 0 ? stderr : '[empty]'],
                ];
                if (err) {
                    sections.push(['error', (0, util_1.stringFromMaybeError)(err)]);
                }
                const text = sections.map(([name, content]) => `${name}:\n${content}`).join('\n\n');
                const html = sections.map(([name, content]) => `<h2>${name}</h2><pre>${content}</pre>`).join('<p><br></p>');
                log(err ? 'error' : 'info', title, '\n', text);
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
            });
        }
        catch (err) {
            const messageSummary = `failed to run job ${job.name}`;
            log('error', messageSummary, err);
        }
    };
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
            log('info', `running job "${job.name}" for the first time`);
            run();
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