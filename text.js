import { DisposableComputed, DisposableState } from './disposable.js';

export class TextState extends DisposableState {
	toString() {
		return `<!--${this.ref}-->`;
	}
}

export class TextComputed extends DisposableComputed {
	toString() {
		return `<!--${this.ref}-->`;
	}
}

export const $text = (val, config) => typeof val === 'function'
	? new TextComputed(val, config)
	: new TextState(val, config);
