import { escapeHTML } from '@aegisjsproject/escape/html.js';
import { DisposableComputed, DisposableState } from './disposable.js';
import { ZERO_WIDTH_SPACE } from './consts.js';

export class TextState extends DisposableState {
	toString() {
		return `<!--${this.ref}-->${escapeHTML(this.get() || ZERO_WIDTH_SPACE)}<!--/${this.ref}-->`;
	}
}

export class TextComputed extends DisposableComputed {
	toString() {
		return `<!--${this.ref}-->${escapeHTML(this.get() || ZERO_WIDTH_SPACE)}<!--/${this.ref}-->`;
	}
}

export const $text = (val, config) => typeof val === 'function'
	? new TextComputed(val, config)
	: new TextState(val, config);
