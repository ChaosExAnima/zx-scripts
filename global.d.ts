declare function spinner<T>(callback: () => T): Promise<T>;
declare function spinner<T>(title: string, callback: () => T): Promise<T>;

declare namespace NodeJS {
	interface ProcessEnv {
		HASS_SERVER: string;
		HASS_TOKEN: string;
		SWARM_MANAGER: string;
	}
}
