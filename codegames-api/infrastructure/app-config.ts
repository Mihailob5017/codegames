import type { EnvConfig } from "./env-config";

let appConfig: EnvConfig | null = null;

export function initializeAppConfig(config: EnvConfig): void {
	appConfig = config;
}

export function getAppConfig(): EnvConfig {
	if (!appConfig) {
		throw new Error("Application config has not been initialized");
	}
	return appConfig;
}
