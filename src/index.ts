import 'reflect-metadata';

import {join} from 'path';
import {inspect} from 'util';
import {readFile} from 'fs/promises';
import {parse} from 'yaml';

import {createTransport} from 'nodemailer';

import schedule, {type JobsContext} from './runner';

import {createWriteStream} from 'fs';

import {
	validate,
} from 'class-validator';

import {
	plainToInstance,
} from 'class-transformer';

import {findPackageJsonDir, dateFmt} from './util';
import {Config, type LogFunction} from './lib';

const argsForDisplay = (...args: unknown[]) => args.map(arg => {
	if (typeof arg === 'string') {
		return arg.toLowerCase();
	}

	return inspect(arg, {depth: Infinity});
});

const main = async () => {
	const root = await findPackageJsonDir(__dirname);
	const configYaml = parse(await readFile(join(root, 'config.yaml'), 'utf8')) as unknown;
	const config = plainToInstance(Config, configYaml);
	const logFilePath = join(root, 'logs', 'cron.log');
	const logStream = createWriteStream(logFilePath, {flags: 'a'});

	const configErrors = await validate(config);

	const log: LogFunction = (level, ...args) => {
		const now = new Date();

		logStream.write(JSON.stringify({
			level,
			date: now,
			args,
		}));
		logStream.write('\n');

		console.log(`[${level} @ ${dateFmt(now)}]`, ...argsForDisplay(...args));
	};

	if (configErrors.length > 0) {
		log('error', 'config validation failed', configErrors);
		return;
	}

	log('success', 'config validation passed', config);

	const mailer = createTransport(config.smtp);

	const jobsContext: JobsContext = {
		log,
		mailerFrom: config.smtp.auth.user,
		mailer,
		jobs: config.jobs,
		emailNotificationsRecipients: config.emailNotificationsRecipients,
	};

	schedule(jobsContext).then(
		() => {
			log('success', `${config.jobs.length} jobs have been scheduled, please keep this window open otherwise they will not run!`);
		},
		err => {
			log('error', 'an error occurred in the CRONs', err);
		},
	);
};

main().catch(err => {
	console.error(
		'an error occurred in the CRONs,',
		'it should have been caught earlier,',
		'this is bad',
		err,
	);
});
