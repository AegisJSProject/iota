import { RegistryKey as Key } from '@aegisjsproject/disposable-registry';
let n = 0;

export class RegistryKey extends Key {
	dispose() {
		if (! this.disposed) {
			this[Symbol.dispose]();
		}
	}
	// #stack = new DisposableStack();

	// /**
	//  * @returns {boolean}
	//  */
	// get disposed() {
	// 	return this.#stack.disposed;
	// }

	// /**
	//  * @template T
	//  * @param {T} what
	//  * @param {() => void} onDiposed
	//  * @returns {T}
	//  */
	// adopt(what, onDiposed) {
	// 	return this.#stack.adopt(what, onDiposed);
	// }

	// /**
	//  * @param {() => void} onDiposed
	//  * @returns {void}
	//  */
	// defer(onDiposed) {
	// 	return this.#stack.defer(onDiposed);
	// }

	// /**
	//  * @returns {void}
	//  */
	// dispose() {
	// 	this.#stack.dispose();
	// 	super[Symbol.dispose]();
	// }

	// /**
	//  * @template T
	//  * @param {T} what
	//  * @returns {T}
	//  */
	// use(what) {
	// 	return this.#stack.use(what);
	// }

	// [Symbol.dispose]() {
	// 	this.#stack.dispose();
	// 	super[Symbol.dispose]();
	// }
}

/**
 *
 * @param {string} [prefix="ref-"]
 * @param {number} [suffix=Date.now()]
 * @returns {RegistryKey}
 */
export const getRef = (prefix = 'ref', suffix = Date.now()) => new RegistryKey(`${prefix}-${n++}-${suffix.toString(16)}`);
export const $ref = getRef;
