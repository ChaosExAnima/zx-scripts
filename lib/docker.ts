import { error } from './log';

function jsonLinesToArray(jsonLines: string) {
	return JSON.parse(`[${jsonLines.split('\n').filter(Boolean).join(',')}]`);
}

export function setContext(context?: string) {
	if (!context) {
		if (!process.env.DOCKER_CONTEXT) {
			error('No docker context specified');
		}
		context = process.env.DOCKER_CONTEXT;
	}
	return $`docker context use ${context}`.quiet();
}

export async function getServices(): Promise<DockerService[]> {
	await setContext('central');
	const raw = await $`docker service ls --format json`;
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
