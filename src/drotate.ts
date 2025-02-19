import { warn } from 'console';
import { inspectService, ServiceInfo } from 'lib/docker';
import { loadEnvVars } from 'lib/env';
import { checkArgsOrShowHelp, error, showHelpAndExit } from 'lib/log';

const {
	args: [secretName, secretFile],
	flags: { config },
} = checkArgsOrShowHelp({
	args: [
		'secret_name',
		{
			name: 'secret_file',
			optional: true,
			help: 'File path of secret source',
		},
	],
	flags: [
		{
			name: 'config',
			alias: 'c',
			help: 'Rotate config file instead of secret',
		},
	],
	help: 'Rotate Docker secret or config',
});

await loadEnvVars();

$.verbose = true;

const type = config ? 'config' : 'secret';

async function fetchServicesWithSecret() {
	try {
		await $`docker ${type} rm ${secretName}`.quiet();
	} catch (err) {
		if (err instanceof ProcessOutput) {
			const result = err.stderr;
			if (result.includes('not found')) {
				error(`Could not find ${type} "${secretName}"`);
			}

			const services = result
				.slice(result.lastIndexOf(':') + 1)
				.trim()
				.split(', ');
			return services;
		}
	}
	return [];
}

async function updateServiceSecret(
	service: ServiceInfo,
	oldSecretName: string,
	newSecretName: string,
) {
	const serviceName = service.Spec.Name;
	const target = service.Spec.TaskTemplate.Secrets.find(
		(secret) => secret.SecretName === oldSecretName,
	);
	if (target) {
		const serviceFlags = [
			`--${type}-rm`,
			oldSecretName,
			`--${type}-add`,
			`source=${newSecretName},target=${target.File.Name}`,
		];
		await $`docker service ${serviceFlags}`;
	} else {
		error(
			`Could not find ${type} ${oldSecretName} on service ${serviceName}`,
		);
	}
}

const rotSecretName = `${secretName}.rot`;
try {
	const [services] = await spinner(
		`Preparing to replace ${secretName}…`,
		() =>
			Promise.all([
				fetchServicesWithSecret(),
				$`docker ${type} create ${rotSecretName} ${secretFile || '-'}`,
			]),
	);

	for (const serviceName of services) {
		const service = await inspectService(serviceName);
		await updateServiceSecret(service, secretName, rotSecretName);
	}

	try {
		await $`docker ${type} rm ${secretName}`;
	} catch (err) {
		warn(`Could not delete ${type} ${secretName}`);
	}
	await $`docker ${type} create ${secretName} ${secretFile || '-'}`;

	for (const serviceName of services) {
		const service = await inspectService(serviceName);
		await updateServiceSecret(service, rotSecretName, secretName);
	}
} finally {
	await $`docker ${type} rm ${rotSecretName}`;
}
