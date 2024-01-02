import { getServiceDetails, setContext, validateService } from 'lib/docker';
import { error } from 'lib/log';

const [service] = argv._.slice(0);

const details = await spinner('Getting service', async () => {
	await validateService(service);
	return getServiceDetails(service);
});

if (details.length > 1) {
	error('Multiple services found');
}
if (process.env.DOCKER_CONTEXT !== details[0].Node) {
	await setContext(details[0].Node);
}
await $`docker run --rm -it --volumes-from ${details[0].Name}.${details[0].ID} chaosexanima/toolkit zsh`;
await setContext('default');
