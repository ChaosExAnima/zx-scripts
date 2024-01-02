import { getServiceEnv, setContext } from 'lib/docker';
import { showHelpAndExit } from 'lib/log';

if (argv._.length !== 1) {
	showHelpAndExit('Required args: [service]');
}

const [service] = argv._;

const details = await getServiceEnv(service);

await $`docker run --rm -it --volumes-from ${details.Name}.${details.ID} chaosexanima/toolkit zsh`;
await setContext('default');
