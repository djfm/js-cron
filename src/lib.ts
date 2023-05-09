import {
	ArrayNotEmpty,
	IsInt,
	IsNotEmpty,
	Max,
	Min,
	ValidateNested,
} from 'class-validator';

import {Type} from 'class-transformer';

export type LogLevel = 'info' | 'error' | 'debug' | 'success' | 'successfully' | 'warning' | 'failed';

export type LogFunction = (level: LogLevel, ...args: unknown[]) => void;

export class SmtpAuth {
	@IsNotEmpty()
		user = '';

	@IsNotEmpty()
		pass = '';
}

export class SmtpConfig {
	@ValidateNested()
	@Type(() => SmtpAuth)
		auth = new SmtpAuth();

	@IsNotEmpty()
		host = '';

	@Min(1)
	@IsInt()
		port = 0;

	secure = true;
}

export class Job {
	@IsNotEmpty()
		name = '';

	@IsNotEmpty()
		fullPathToExecutable = '';

	@IsInt()
	@Min(0)
	@Max(23)
		hour = -1;

	@IsInt()
	@Min(0)
	@Max(59)
		minute = -1;

	@IsInt()
	@Min(0)
	@Max(59)
		second = 0;
}

export class Config {
	@ValidateNested()
	@Type(() => SmtpConfig)
		smtp = new SmtpConfig();

	@ValidateNested()
	@ArrayNotEmpty()
	@Type(() => Job)
		jobs: Job[] = [];

	@ArrayNotEmpty()
	@IsNotEmpty({each: true})
		emailNotificationsRecipients: string[] = [];
}
