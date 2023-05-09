import {type ExecException, exec} from 'child_process';

import {type Transporter} from 'nodemailer';

import {stringFromMaybeError, dateFmt} from './util';
import {type LogFunction, type Job} from './lib';

export type JobsContext = {
	mailer: Transporter;
	mailerFrom: string;
	log: LogFunction;
	jobs: Job[];
	emailNotificationsRecipients: string[];
};

const oneHourInMs = 60 * 60 * 1000;
const oneDayInMs = 24 * oneHourInMs;

type ExecResult = {
	exitCode?: number;
	err?: ExecException;
	stdout: string;
	stderr: string;
};

const asyncExec = async (cmd: string): Promise<ExecResult> => new Promise(resolve => {
	// eslint-disable-next-line @typescript-eslint/ban-types
	const res = exec(cmd, (err: ExecException | null, stdout: string, stderr: string) => {
		resolve({
			err: err ?? undefined,
			exitCode: res.exitCode ?? undefined,
			stdout,
			stderr,
		});
	});
});

const retryDelayMs = 5000;

export const schedule = async ({jobs, log, mailer, mailerFrom, emailNotificationsRecipients: recipients}: JobsContext): Promise<void> => {
	const makeJobRunner = (job: Job) => async () => {
		try {
			let attempt = 1;

			for (; attempt <= job.maxTries; ++attempt) {
				// eslint-disable-next-line no-await-in-loop
				const result = await asyncExec(job.fullPathToExecutable);

				const now = dateFmt(new Date());

				const failed = result.err ?? result.exitCode !== 0;

				if (failed && attempt < job.maxTries) {
					log('warning', `job ${job.name} at ${now} failed, retrying in ${retryDelayMs} ms`);
					// eslint-disable-next-line no-await-in-loop
					await new Promise(resolve => {
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
					['status', `the process exited with status ${result.exitCode ?? '[unknown]'}`],
					['stdout', result.stdout.trim() ?? '[empty]'],
					['stderr', result.stderr.trim() ?? '[empty]'],
				];

				if (attempt > 1) {
					sections.push(['all attempts have failed', `${attempt}/${job.maxTries}, all failed`]);
				}

				if (result.err) {
					sections.push(['error', stringFromMaybeError(result.err)]);
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
			}
		} catch (err) {
			const messageSummary = `failed to run job ${job.name}`;
			log('error', messageSummary, err);
		}
	};

	const scheduleJob = (job: Job) => {
		const now = new Date();
		const desiredNextRun = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			job.hour,
			job.minute,
			job.second,
		);

		const msTillFirstRun = desiredNextRun.getTime() - now.getTime();

		const firstRunTimeout = msTillFirstRun > 0
			? msTillFirstRun
			: (msTillFirstRun + oneDayInMs);

		log('info', `scheduling job "${job.name}" to run in`, firstRunTimeout, 'ms');

		const run = makeJobRunner(job);

		setTimeout(() => {
			log('info', `running job "${job.name}" for the first time`);

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
};

export default schedule;
