import { DisposableState, DisposableComputed } from './disposable.js';

const ZERO_WIDTH_SPACE = '\u200B';

export class ListComputed extends DisposableComputed {
	static REF_PREFIX = '__list_signal';

	constructor(callback, config) {
		super(() => {
			const value = callback();

			if (Array.isArray(value)) {
				return value;
			} else if (typeof value[Symbol.iterator] === 'function') {
				return Array.from(value);
			} else {
				return [value];
			}
		}, config);
	}

	map(cb) {
		return new ListComputed(cb);
	}

	toString() {
		return `${ZERO_WIDTH_SPACE}<!--${this.ref}-->`;
	}
}

export class ListState extends DisposableState {
	constructor(value, config) {
		if (Array.isArray(value)) {
			super(value, config);
		} else if (typeof value[Symbol.iterator] === 'function') {
			super(Array.from(value), config);
		} else {
			super([value], config);
		}
	}

	map(cb) {
		return new ListComputed(cb);
	}

	toString() {
		return `${ZERO_WIDTH_SPACE}<!--${this.ref}-->`;
	}
}

export const $list = (val, config) => typeof val === 'function'
	? new ListComputed(val, config)
	: new ListState(val, config);
