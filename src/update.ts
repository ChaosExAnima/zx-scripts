import 'zx/globals';
import { loadEnvVars } from 'lib/env';
import { showHelpAndExit } from 'lib/log';

const args = argv._;
const doAll = argv.a || argv.all;

if (!args.length && !doAll) {
	showHelpAndExit(
		'Allows updating of one or more Docker services',
		'Flags:',
		'--all|-a Update all services.',
	);
}

await loadEnvVars();

if (process.env.DOCKER_CONTEXT) {
	await $`docker context use ${process.env.DOCKER_CONTEXT}`.quiet();
}

const services = (
	await $`docker service ls --format "{{.Name}} {{.Image}} {{.Replicas}}"`.quiet()
).stdout
	.trim()
	.split('\n')
	.map((l) => l.split(' ', 3));

for (const [name, image, replicas] of services) {
	if (replicas.includes('0') || (!doAll && !args.includes(name))) {
		continue;
	}
	await $`docker image ls ${image}`;
}
