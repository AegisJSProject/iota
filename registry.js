import { Signal } from '@shgysk8zer0/signals';
import { Registry, registerKey, unregisterKey, getFromRegistry, hasRegistryKey } from '@aegisjsproject/disposable-registry';

/**
 * @type {Map<string, Signal.State<T>}
 */
const signalReg = new Registry();

/**
 *
 * @param {string|String} ref
 * @param {Signal.Computed|Signal.State} signal
 */
export function registerSignal(ref, signal) {
	if (! (signal instanceof Signal.State || signal instanceof Signal.Computed)) {
		throw new TypeError('Signal must be a `Signal.State` or `Signal.Computed`.');
	} else if (signalReg.has(ref)) {
		throw new TypeError(`${ref} is already registered.`);
	} else if (typeof ref === 'string' || ref instanceof String) {
		registerKey(ref, signal, signalReg);
	} else {
		throw new TypeError('Invalid registry key.');
	}
}

/**
 *
 * @param {string|String} ref
 * @returns {boolean}
 */
export const unregisterSignal = ref => unregisterKey(ref, signalReg);

/**
 *
 * @param {string|String} ref
 * @returns {Signal.State|undefined}
 */
export const getSignalFromRef = ref => getFromRegistry(ref, signalReg);

/**
 *
 * @param {string|String} ref
 * @returns {boolean}
 */
export const hasSignalRef = ref => hasRegistryKey(ref, signalReg);
