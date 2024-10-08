import { getServiceEnv } from 'lib/docker';
import { showHelpAndExit } from 'lib/log';

if (argv._.length !== 1) {
	showHelpAndExit(
		'Required args: [service] [-b]',
		'',
		'Flags:',
		' b: Binds the current directory to /host in the container',
	);
}

const [service, ...rest] = argv._;

const details = await getServiceEnv(service);

const flags = [
	'--rm',
	'-it',
	`--volumes-from=${details.Name}.${details.ID}`,
	...rest,
];
if (argv.b) {
	flags.push(`-v=${process.cwd()}:/host`);
}
flags.push('chaosexanima/toolkit', 'zsh');

await $`docker run ${flags}`;
