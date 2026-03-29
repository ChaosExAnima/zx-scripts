import { getServices } from 'lib/docker';
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

const services = await getServices();

for (const { Name: name, Image: image, Replicas: replicas } of services) {
	if (replicas.includes('0') || (!doAll && !args.includes(name))) {
		continue;
	}
	await spinner(
		`Pulling image ${image}...`,
		() => $`docker image pull ${image}`,
	);

	await spinner(
		`Restarting service ${name}...`,
		() => $`docker service update --image ${image} --force ${name}`,
	);
}
