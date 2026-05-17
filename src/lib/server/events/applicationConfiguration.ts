import { EventEmitter } from 'events';
import type { TApplicationConfiguration } from '$lib/shared/applicationConfiguration';

class ApplicationConfigurationEmitter extends EventEmitter {
	emitUpdated(configuration: TApplicationConfiguration) {
		this.emit('updated', configuration);
	}
}

export const applicationConfigurationEmitter = new ApplicationConfigurationEmitter();
