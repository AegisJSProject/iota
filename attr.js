import { DisposableComputed, DisposableState } from './disposable.js';

export const SIGNAL_DATA_ATTR = 'data-attr-signal';

export class AttrState extends DisposableState {
	#name;

	constructor(name, value, config) {
		super(value, config);
		this.#name = name;
	}

	get name() {
		return this.#name;
	}

	toString() {
		return `${SIGNAL_DATA_ATTR}="${this.ref}"`;
	}
}

export class AttrComputed extends DisposableComputed {
	#name;

	constructor(name, callback, config) {
		super(callback, config);
		this.#name = name;
	}

	get name() {
		return this.#name;
	}

	toString() {
		return `${SIGNAL_DATA_ATTR}="${this.ref}"`;
	}
}

export const $attr = (name, val, config) => typeof val === 'function'
	? new AttrComputed(name, val, config)
	: new AttrState(name, val, config);
