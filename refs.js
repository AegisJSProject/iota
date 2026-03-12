let n = 0;

export class RegistryKey extends String {
	#stack = new DisposableStack();

	get disposed() {
		return this.#stack.disposed;
	}

	adopt(what, onDiposed) {
		return this.#stack.adopt(what, onDiposed);
	}

	defer(onDiposed) {
		return this.#stack.defer(onDiposed);
	}

	use(what) {
		return this.#stack.use(what);
	}

	[Symbol.dispose]() {
		this.#stack.dispose();
	}
}

/**
 *
 * @param {string} [prefix="ref-"]
 * @param {number} [suffix=Date.now()]
 * @returns {RegistryKey}
 */
export const getRef = (prefix = 'ref', suffix = Date.now()) => new RegistryKey(`${prefix}-${n++}-${suffix.toString(16)}`);
export const $ref = getRef;
