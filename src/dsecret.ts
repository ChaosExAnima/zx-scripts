import { getSecret, setContext } from 'lib/docker';
import { loadEnvVars } from 'lib/env';
import { bold, checkArgsOrShowHelp, error, warning } from 'lib/log';

const {
	args: [name, secretName],
} = checkArgsOrShowHelp({
	args: ['name', 'secret'],
	help: 'Sync Docker secret and 1Password',
});

try {
	const label = name.replace('_', ' ');
	const secret = await spinner('Getting secret', () =>
		Promise.any([getSecret(secretName), getSecret(secretName, label)]),
	);

	await loadEnvVars();
	await setContext();
	if (argv.force || argv.f) {
		try {
			await spinner(
				'Removing old secret',
				() => $`docker secret rm ${name}`,
			);
		} catch (err) {
			warning(err);
		}
	}
	await spinner('Creating secret', async () => {
		const createSecret = $`docker secret create ${name} -`;
		createSecret.stdin.write(secret);
		createSecret.stdin.end();
		const result = await createSecret;
		if (argv.quiet || argv.q) {
			echo(result.stdout.trim());
		} else {
			bold(`🤐 Created secret:`, result.stdout.trim());
		}
	});
} catch (err) {
	error(err);
}
