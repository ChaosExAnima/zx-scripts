import { getServiceEnv, setContext } from 'lib/docker';
import { loadEnvVars } from 'lib/env';
import { showHelpAndExit } from 'lib/log';

if (argv._.length < 2) {
	showHelpAndExit('Required args: [service] [...commands]');
}

const [service, ...commands] = argv._;

const details = await getServiceEnv(service);

await $`docker container exec -it ${details.Name}.${details.ID} ${commands}`;
await setContext('default');
