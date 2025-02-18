import { loadEnvVars } from './env';
import { debug, error } from './log';

function jsonLinesToArray(jsonLines: string) {
	return JSON.parse(`[${jsonLines.split('\n').filter(Boolean).join(',')}]`);
}

export async function setContext(context?: string) {
	if (!context) {
		if (!process.env.SWARM_MANAGER) {
			error('No swarm manager specified');
		}
		context = process.env.SWARM_MANAGER;
	}
	debug('Setting docker context to', context);
	process.env.DOCKER_CONTEXT = context;
}

export async function getServices(): Promise<DockerService[]> {
	await setContext();
	const raw = await $`docker service ls --format json`.quiet();
	return jsonLinesToArray(raw.toString()) as DockerService[];
}

interface DockerService {
	ID: string;
	Image: string;
	Mode: string;
	Name: string;
	Ports: string;
	Replicas: string;
}

export async function validateService(service?: string) {
	if (!service) {
		error('No service provided');
	}
	const services = await getServices();
	if (!services.find((svc) => svc.Name === service)) {
		error(`Service ${service} not found`);
	}
}

export async function getServiceDetails(service: string) {
	const raw =
		await $`docker service ps ${service} --format json --no-trunc --filter desired-state=running`;
	const services = jsonLinesToArray(raw.toString()) as DockerServiceDetails[];
	if (services.length === 0) {
		error(`Service ${service} not found or not running`);
	}
	return services;
}

interface DockerServiceDetails {
	CurrentState: string;
	DesiredState: string;
	Error: string;
	ID: string;
	Image: string;
	Name: string;
	Node: string;
	Ports: string;
}

type Labels = {
	[key: string]: string;
};

interface Mount {
	Type: 'volume';
	Source: string;
	Target: string;
	VolumeOptions: {
		Labels: Labels;
	};
}

interface Secret {
	File: {
		Name: string;
		UID: string;
		GID: string;
		Mode: number;
	};
	SecretID: string;
	SecretName: string;
}

interface Network {
	Target: string;
	Aliases: string[];
}

interface ServiceSpec {
	Name: string;
	Labels: Labels;
	TaskTemplate: {
		ContainerSpec: {
			Image: string;
			Labels: Labels;
			Env: string[];
		};
		Mounts: Mount[];
		Secrets: Secret[];
	};
	Placement: {
		Constraints: string[];
		Networks: Network[];
	};
}

export interface ServiceInfo {
	ID: string;
	Version: {
		Index: number;
	};
	CreatedAt: string;
	UpdatedAt: string;
	Spec: ServiceSpec;
	PreviousSpec: ServiceSpec;
}

export async function inspectService(service: string) {
	const proc = await $`docker service inspect ${service}`;
	const services = JSON.parse(proc.toString()) as ServiceInfo[];
	return services[0];
}

export async function getServiceEnv(service: string) {
	await loadEnvVars();
	const [details] = await spinner('Getting service', () =>
		Promise.all([getServiceDetails(service), validateService(service)]),
	);

	if (details.length === 0) {
		error(`Service ${service} not found or not running`);
	} else if (details.length > 1) {
		error('Multiple services found');
	}
	if (process.env.DOCKER_CONTEXT !== details[0].Node) {
		await setContext(details[0].Node);
	}

	return details[0];
}
