import fs from 'node:fs/promises';
import path from 'node:path';
import { debug, error } from './log';
import { homedir } from 'node:os';

const cacheMap = new Map<string, any>();
function varCache<Value extends any>(
	key: string,
	value?: Value,
): Value | undefined {
	if (value !== undefined) {
		cacheMap.set(key, value);
	}
	return cacheMap.get(key);
}

export type EnvVarsMap = Map<string, string>;

const CONFIG_PATH = path.resolve(homedir(), '.config', 'scripts.env');

export async function loadEnvVars(required = true): Promise<EnvVarsMap> {
	const envVars = new Map<string, string>();

	try {
		const envPaths = [CONFIG_PATH];
		for (const envPath of envPaths) {
			debug('Getting env from path:', envPath);
			try {
				await fs.access(envPath);
			} catch (err) {
				debug('Creating env path:', envPath);
				await fs.mkdir(path.dirname(envPath), { recursive: true });
				await fs.writeFile(envPath, '', 'utf-8');
				return envVars;
			}
			const rawEnv = await fs.readFile(envPath, 'utf-8');
			for (const env of rawEnv.split('\n')) {
				const [key, value] = env.trim().split('=', 2);
				if (!key || !value) {
					continue;
				}
				debug('Setting env var:', key, value);
				if (!key.startsWith('SECRET_')) {
					process.env[key] = value;
				}
				envVars.set(key, value);
			}
		}
	} catch (err: unknown) {
		if (required) {
			error(err);
		} else {
			debug(err);
		}
	}
	return envVars;
}

export async function saveEnv(
	key: string,
	value?: string,
): Promise<EnvVarsMap> {
	const envVars = await loadEnvVars();
	if (value !== undefined) {
		envVars.set(key, value);
	} else {
		envVars.delete(key);
	}

	// Get config string
	let envString = '';
	for (const [envKey, envValue] of envVars) {
		envString += `${envKey}=${envValue}\n`;
	}

	try {
		await fs.writeFile(CONFIG_PATH, envString, 'utf-8');
	} catch (err) {
		error('Failed to save environment variables to config path');
	}

	return envVars;
}

// Save secrets with the following command: `security add-generic-password -s [name] -w "[secret]"`

export async function loadSecret(name: string) {
	try {
		const rawSecret = await $`security find-generic-password -s ${name} -w`;
		const secret = rawSecret.stdout.trim();
		if (!secret) {
			throw new Error(`Could not find secret: ${name}`);
		}
		return secret;
	} catch (err) {
		error('Could not get secret');
	}
	return '';
}

let isOpValid = false;

export async function loadFromOp(name: string): Promise<string> {
	const op = await import('@1password/op-js');
	try {
		if (!isOpValid) {
			debug('validating op');
			await op.validateCli();
			isOpValid = true;
		}
	} catch (err) {
		error(err);
	}
	const item = op.item.get(name);
	return item.fields?.at(0)?.value || '';
}
