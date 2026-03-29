import { getServiceEnv } from 'lib/docker';
import { debug, showHelpAndExit } from 'lib/log';

if (argv._.length < 2) {
	showHelpAndExit('Required args: [service] [...commands]');
}

const [service, ...commands] = argv._;

const details = await getServiceEnv(service);

debug(
	`flags: docker container exec -it ${details.Name}.${details.ID} ${commands}`,
);

await $({
	stdio: ['inherit', 'inherit', 'inherit'],
})`docker container exec -it ${details.Name}.${details.ID} ${commands}`;
