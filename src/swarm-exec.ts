import { error, showHelpAndExit } from 'lib/log';
import { spinner } from 'zx';
import 'zx/globals';

const args: string[] = argv._;

$.verbose = false;

async function listToArray(cmd: string | ProcessPromise) {
	const list = typeof cmd === 'string' ? cmd : (await cmd).toString();
	return list
		.split('\n')
		.map((c) => c.trim())
		.filter(Boolean);
}

if (process.env.DOCKER_CONTEXT) {
	await $`docker context use ${process.env.DOCKER_CONTEXT}`;
}
const containers = await spinner('Getting services', () =>
	listToArray(
		argv.$`docker service ps $(docker service ls -q) --format "{{.Name}}.{{.ID}}" --no-trunc -f "desired-state=running"`,
	),
);
const services = containers.map((container) => container.split('.')[0]);

if (args.length < 2) {
	showHelpAndExit(
		'Required args: [service] [...commands]',
		'',
		'Services:',
		services.map((svc) => `- ${svc}`),
	);
}

const serviceName = args[0];
if (!services.includes(serviceName)) {
	error(`Unknown service: ${serviceName}`);
}

const psArgs = [
	'-f',
	'desired-state=running',
	'--format',
	'{{.Name}}.{{.ID}}',
	'--no-trunc',
	serviceName,
] as const;
const containerName = containers.find((container) =>
	container.startsWith(serviceName),
);
// const containerNames = await spinner('Finding container', () =>
// 	listToArray($`docker service ps ${psArgs}`),
// );
if (!containerName) {
	error('Got wrong number of containers');
}

$.verbose = true;
await $`docker container exec -it ${containerName} ${args.slice(1)}`;
