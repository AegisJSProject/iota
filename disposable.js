import { Signal } from '@shgysk8zer0/signals';
import { getRef } from './refs.js';
import { registerSignal, unregisterSignal } from './registry.js';

/**
 * @typedef SignalConfig
 * @property {(a, b) => boolean} config
 * @property {() => void} [Signal.subtle.watched]
 * @property {() => void} [Signal.subtle.unwatched]
 */

/**
 * @template T
 */
export class DisposableState extends Signal.State {
	static REF_PREFIX = '__signal_ref';
	#ref = getRef(this.constructor.REF_PREFIX ?? '__signal_ref');

	/**
	 * @param {T} value
	 * @param {SignalConfig} [config]
	 */
	constructor(value, {
		[Signal.subtle.watched]: onWatched,
		[Signal.subtle.unwatched]: onUnwatched,
		equals = Object.is,
	} = {}) {
		super(value, {
			equals: (a, b) => this.#ref.disposed ? true : equals(a, b),
			[Signal.subtle.watched]: onWatched,
			[Signal.subtle.unwatched]: onUnwatched,
		});

		registerSignal(this.#ref, this);
		this.#ref.defer(() => unregisterSignal(this.#ref));
		this.handleEvent = this.handleEvent.bind(this);
	}

	/**
	 *
	 * @param {Event} event
	 * @returns {void}
	 */
	handleEvent(event) {
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
			this.set(event.target.value);
		}
	}

	/**
	 * @returns {T}
	 */
	get ref() {
		return this.#ref;
	}

	/**
	 * @returns {boolean}
	 */
	get disposed() {
		return this.#ref.disposed;
	}

	[Symbol.dispose]() {
		if (! this.#ref.disposed) {
			this.#ref.dispose();

			Signal.subtle.introspectSinks(this).forEach(sink => {
				if (sink instanceof Signal.subtle.Watcher) {
					sink.unwatch(this);
				}
			});
		}
	}

	static get onWatched() {
		return Signal.subtle.watched;
	}

	static get onUnwatched() {
		return Signal.subtle.unwatched;
	}
}

/**
 * @template T
 */
export class DisposableComputed extends Signal.Computed {
	static REF_PREFIX = '__signal_ref';
	#ref = getRef(this.constructor.REF_PREFIX ?? '__signal_ref');

	/**
	 * @param {() => T} value
	 * @param {SignalConfig} [config]
	 */
	constructor(callback, {
		[Signal.subtle.watched]: onWatched,
		[Signal.subtle.unwatched]: onUnwatched,
		equals = Object.is,
	} = {}) {
		super(callback, {
			equals: (a, b) => this.#ref.disposed ? true : equals(a, b),
			[Signal.subtle.watched]: onWatched,
			[Signal.subtle.unwatched]: onUnwatched,
		});

		registerSignal(this.#ref, this);
		this.#ref.defer(() => unregisterSignal(this.#ref));
	}

	/**
	 * @returns {T}
	 */
	get ref() {
		return this.#ref;
	}

	/**
	 * @returns {boolean}
	 */
	get disposed() {
		return this.#ref.disposed;
	}

	/**
	 * @returns {void}
	 */
	dispose() {
		this[Symbol.dispose]();
	}

	[Symbol.dispose]() {
		if (! this.#ref.disposed) {
			this.#ref[Symbol.dispose]();
			Signal.subtle.introspectSinks(this).forEach(sink => {
				if (sink instanceof Signal.subtle.Watcher) {
					sink.unwatch(this);
				}
			});
		}
	}

	static get onWatched() {
		return Signal.subtle.watched;
	}

	static get onUnwatched() {
		return Signal.subtle.unwatched;
	}
}

/**
 * @template T
 * @param {T} initial
 * @param {SignalConfig} [config]
 * @returns {Signal.State<T>}
 */
export const $signal = (initial, config) => new DisposableState(initial, config);

/**
 * @template T
 * @param {() => T} callback
 * @param {SignalConfig} [config]
 * @returns {Signal.Computed<T>}
 */
export const $computed = (callback, config) => new DisposableComputed(callback, config);
