import { Signal } from '@shgysk8zer0/signals';
import { getRef } from './refs.js';
import { registerSignal, unregisterSignal } from './registry.js';

export class DisposableState extends Signal.State {
	#ref = getRef('__signal_ref');

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

	handleEvent(event) {
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
			this.set(event.target.value);
		}
	}

	get ref() {
		return this.#ref;
	}

	get disposed() {
		return this.#ref.disposed;
	}

	[Symbol.dispose]() {
		if (! this.#ref.disposed) {
			this.#ref[Symbol.dispose]();

			Signal.subtle.introspectSinks(this).forEach(source => {
				if (source instanceof Signal.subtle.Watcher) {
					source.unwatch(this);
				}
			});
		}
	}
}

export class DisposableComputed extends Signal.Computed {
	#ref = getRef('__signal_ref');

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

	get ref() {
		return this.#ref;
	}

	get disposed() {
		return this.#ref.disposed;
	}

	dispose() {
		this[Symbol.dispose]();
	}

	[Symbol.dispose]() {
		if (! this.#ref.disposed) {
			this.#ref[Symbol.dispose]();

			Signal.subtle.introspectSinks(this).forEach(source => {
				if (source instanceof Signal.subtle.Watcher) {
					source.unwatch(this);
				}
			});
		}
	}
}

export const $signal = (initial, config) => new DisposableState(initial, config);
export const $computed = (callback, config) => new DisposableComputed(callback, config);
