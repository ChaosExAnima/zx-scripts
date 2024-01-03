import { getServiceEnv } from 'lib/docker';
import { showHelpAndExit } from 'lib/log';

if (argv._.length < 2) {
	showHelpAndExit('Required args: [service] [...commands]');
}

const [service, ...commands] = argv._;

const details = await getServiceEnv(service);

await $`docker container exec -it ${details.Name}.${details.ID} ${commands}`;
