import { escapeHTML } from '@aegisjsproject/escape/html.js';
import { DisposableComputed, DisposableState } from './disposable.js';
import { SIGNAL_DATA_ATTR } from './consts.js';

export class AttrState extends DisposableState {
	#name;

	constructor(name, value, config) {
		super(value, config);
		this.#name = name;
	}

	get name() {
		return this.#name;
	}

	get value() {
		const val = this.get();
		return Array.isArray(val) ? val.join(' ') : val;
	}

	set value(val) {
		this.set(val);
	}

	toString() {
		const val = this.get();

		if (Array.isArray(val)) {
			return `${SIGNAL_DATA_ATTR}="${this.ref}" ${this.#name}="${escapeHTML(val.join(' '))}"`;
		} else if (val === false) {
			return `${SIGNAL_DATA_ATTR}="${this.ref}"`;
		} else {
			return `${SIGNAL_DATA_ATTR}="${this.ref}" ${this.#name}="${escapeHTML(val)}"`;
		}
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

	get value() {
		return this.get();
	}

	set value(val) {
		this.set(val);
	}

	toString() {
		const val = this.get();

		if (Array.isArray(val)) {
			return `${SIGNAL_DATA_ATTR}="${this.ref}" ${this.#name}="${escapeHTML(val.join(' '))}"`;
		} else if (val === false) {
			return `${SIGNAL_DATA_ATTR}="${this.ref}"`;
		} else {
			return `${SIGNAL_DATA_ATTR}="${this.ref}" ${this.#name}="${escapeHTML(val)}"`;
		}
	}
}

export const $attr = (name, val, config) => typeof val === 'function'
	? new AttrComputed(name, val, config)
	: new AttrState(name, val, config);

export const $hidden = (val = false, config) => $attr('hidden', val, config);
export const $disabled = (val = false, config) => $attr('disabled', val, config);
export const $inert = (val = false, config) => $attr('inert', val, config);
export const $open = (val = false, config) => $attr('open', val, config);
export const $checked = (val = false, config) => $attr('checked', val, config);
export const $requried = (val = false, config) => $attr('required', val, config);
export const $selected = (val = false, config) => $attr('selected', val, config);
export const $readOnly = (val = false, config) => $attr('readonly', val, config);
export const $muted = (val = false, config) => $attr('muted', val, config);
export const $classList = (val = [], config) => $attr('class', val, config);
export const $value = (val = '', config) => $attr('value', val, config);
export const $data = (name, val = '', config) => $attr('data-' + name.trim().replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(), val, config);
export const $aria = (name, val = '', config) => $attr( 'aria-' + name.trim().toLowerCase(), val, config);
