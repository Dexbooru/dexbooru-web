import { writable } from 'svelte/store';
import type { IAuthFormRequirementData } from '../types/stores';

export const registerFormAuthRequirementsStore = writable<IAuthFormRequirementData>({});
export const changePasswordFormAuthRequirementsStore = writable<IAuthFormRequirementData>({});
export const changeUsernameFormAuthRequirementsStore = writable<IAuthFormRequirementData>({});
