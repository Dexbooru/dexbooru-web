import { EventEmitter } from 'events';

class UploadStatusEmitter extends EventEmitter {}
export const uploadStatusEmitter = new UploadStatusEmitter();

