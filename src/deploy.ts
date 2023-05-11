import 'zx/globals';
import path from 'path';
import fs from 'fs/promises';
import { bold, line, showHelpAndExit } from 'lib/log';
import { loadEnvVars } from 'lib/env';

const cwd = process.cwd();

async function getStackConfigDir(stack: string) {
	try {
		const configDir = path.resolve(cwd, `./${stack}`);
		await fs.access(configDir, fs.constants.R_OK);
		return configDir;
	} catch (err) {
		return null;
	}
}

const args: string[] = argv._;
const shouldDelete = (argv.d || argv.delete) ?? false;
const stacks = (await fs.readdir(cwd))
	.filter((file) => file.endsWith('.yml'))
	.map((file) => file.replace('.yml', ''));
const exit = () =>
	showHelpAndExit(
		'Stack options:',
		stacks.map((stack) => ` - ${stack}`),
		'',
		'Flags:',
		'--delete|-d Tell rsync to delete files.',
	);
if (!args.length) {
	exit();
}
const diff = args.filter((arg) => !stacks.includes(arg));
if (diff.length) {
	echo(`Invalid arg(s): ${diff.join(', ')}\n`);
	exit();
}

await loadEnvVars();

line();
bold('Deploying configs:');
const dirsToSync = (await Promise.all(args.map(getStackConfigDir))).filter(
	Boolean,
);
if (dirsToSync.length) {
	const hosts = process.env.DOCKER_HOSTS?.split(',') ?? [];
	const flags = ['-azhrP'];
	if (shouldDelete) {
		flags.push('--delete');
	}
	for (const host of hosts) {
		await $`rsync ${flags} ${dirsToSync} ${host}:~/docker`;
	}
} else {
	echo('No directories to deploy 😎');
}

if (argv.s || argv.sync) {
	line();
	bold('Skipping deploy. Done! 💥');
	process.exit();
}

line();
bold('Deploying stacks:');
if (process.env.DOCKER_CONTEXT) {
	await $`docker context use ${process.env.DOCKER_CONTEXT}`;
}
await Promise.all(
	args.map(
		(stack) =>
			$`docker stack deploy --with-registry-auth -c ${stack}.yml ${stack}`,
	),
);

line();
bold('Done! 💥');
