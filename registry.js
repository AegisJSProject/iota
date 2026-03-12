import { Signal } from '@shgysk8zer0/signals';

/**
 * @type {Map<string, Signal.State<T>}
 */
const signalReg = new Map();

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
	} else if (typeof ref === 'string') {
		signalReg.set(ref, signal);
	} else if (ref instanceof String) {
		signalReg.set(ref.toString(), signal);
	} else {
		throw new TypeError('Invalid registry key.');
	}
}

/**
 *
 * @param {string|String} ref
 * @returns {boolean}
 */
export const unregisterSignal = ref => ref instanceof String ? signalReg.delete(ref.toString()) : signalReg.delete(ref);

/**
 *
 * @param {string|String} ref
 * @returns {Signal.State|undefined}
 */
export const getSignalFromRef = ref => ref instanceof String ? signalReg.get(ref.toString()) : signalReg.get(ref);

/**
 *
 * @param {string|String} ref
 * @returns {boolean}
 */
export const hasSignalRef = ref => ref instanceof String ? signalReg.has(ref.toString()) : signalReg.has(ref);
