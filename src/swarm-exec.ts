import { error, showHelpAndExit } from 'lib/log';
import 'zx/globals';

const args = argv._;

async function listToArray(cmd: string | ProcessPromise) {
	const list = typeof cmd === 'string' ? cmd : (await cmd).toString();
	return list
		.split('\n')
		.map((c) => c.trim())
		.filter(Boolean);
}

await $`docker context use central`.quiet();
const services = await listToArray(
	$`docker service ls --format "{{.Name}}"`.quiet(),
);

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
const containerNames = await listToArray($`docker service ps ${psArgs}`);
if (containerNames.length !== 1) {
	error('Got wrong number of containers');
}

await $`docker container exec -it ${containerNames[0]} ${args.slice(1)}`;
