import {join} from 'path';
import {stat} from 'fs/promises';

export const stringFromMaybeError = (
	maybeError: unknown,
	defaultMessage = 'unknown error',
): string => {
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

export const findPackageJsonDir = async (dir: string): Promise<string> => {
	const candidate = join(dir, 'package.json');

	try {
		const s = await stat(candidate);
		if (s.isFile()) {
			return dir;
		}
	} catch (e) {
		const parent = join(dir, '..');
		if (parent === dir) {
			throw new Error(`Cannot find package.json in ${dir} nor any of its parents`);
		}

		return findPackageJsonDir(parent);
	}

	throw new Error(`Cannot find package.json in ${dir}`);
};

export const dateFmt = (date: Date): string => `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
