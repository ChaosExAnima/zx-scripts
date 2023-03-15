import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadEnvVars() {
	const rawEnv = await fs.readFile(
		path.resolve(process.cwd(), '.env'),
		'utf-8',
	);
	for (const env of rawEnv.split('\n')) {
		const [key, value] = env.trim().split('=', 2);
		if (!key || !value) {
			continue;
		}
		process.env[key] = value;
	}
}
