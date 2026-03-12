import { Signal } from '@shgysk8zer0/signals';
import { hasSignalRef, getSignalFromRef } from './registry.js';
import { SIGNAL_DATA_ATTR } from './attr.js';

const noop = () => undefined;
/**
 * @type {boolean}
 */
let updating = false;

/**
 * @typedef {Object} AsyncDisposableStackInterface
 * @property {boolean} disposed
 * @property {() => Promise<void>} disposeAsync
 * @property {<T>(value: T) => T} use
 * @property {<T>(value: T, onDispose: (val: T) => void) => T} adopt
 * @property {(onDispose: () => void) => void} defer
 * @property {() => AsyncDisposableStackInterface} move
 */

/**
 * @template T
 * @typedef {Signal.State<T>|Signal.Computed<T>} AnySignal<T>
 */

/**
 * @typedef {Object} SignalObserverParams
 * @property {AsyncDisposableStackInterface} stack
 * @property {AbortSignal} signal
 * @property {number} timeStamp
 */

/**
 * @template T
 * @callback SignalObserverCallback
 * @param {T} value
 * @param {SignalObserverParams} params
 * @returns {void}
 */

/**
 * @template T
 * @type {WeakMap<AnySignal<T>, Set<SignalObserverCallback<T>>>}
 */
const registry = new WeakMap();

/**
 * @type {Signal.subtle.Watcher}
 */
const watcher = new Signal.subtle.Watcher(function() {
	if (! updating) {
		updating = true;

		queueMicrotask(async () => {
			/**
			 * @type {AsyncDisposableStackInterface}
			 */
			const stack = new AsyncDisposableStack();
			const { signal } = stack.adopt(new AbortController(), controller => controller.abort());
			const config = Object.freeze({ stack, signal, timeStamp: performance.now() });

			await Promise.allSettled(watcher.getPending().flatMap(src => {
				const val = src.get();

				return Array.from(
					registry.get(src),
					(callback = noop) => Promise.try(callback, val, config)
						.finally(() => registry.has(src) && watcher.watch(src))
				);
			}));

			stack.disposeAsync()
				.catch(globalThis.reportError?.bind(globalThis))
				.finally(() => updating = false);
		});
	}
});

/**
 * Calls `callback` when `signal` is updated.
 *
 * @template T
 * @param {AnySignal<T>} signal
 * @param {SignalObserverCallback<T>} callback
 */
export function watchSignal(signal, callback) {
	if (! (signal instanceof Signal.State || signal instanceof Signal.Computed)) {
		throw new TypeError('Signal must be a `Signal.State` or `Signal.Computed.');
	} else if (typeof callback !== 'function') {
		throw new TypeError('Callback must be a function.');
	} else if (registry.has(signal)) {
		registry.get(signal).add(callback);
	} else {
		registry.set(signal, new Set([callback]));
		watcher.watch(signal);
	}
}

export const $watch = watchSignal;

/**
 * Unregister `signal` from the signal registry
 *
 * @template T
 * @param {AnySignal<T>} signal
 * @returns {boolean} True if the signal was successfully removed/unwatched
 */
export function unwatchSignal(signal) {
	const result = registry.delete(signal);
	watcher.unwatch(signal);
	return result;
}

export const $unwatch = unwatchSignal;

/**
 * Unregisters a callback assosciate with a `Signal.State` or `Signal.Computed`
 *
 * @template T
 * @param {AnySignal<T>} signal
 * @param {SignalObserverCallback<T>} callback
 * @returns {boolean} Whether or not the callback was registered and was removed
 */
export function unwatchSignalCallback(signal, callback) {
	if (registry.has(signal)) {
		const callbacks = registry.get(signal);
		const removed = callbacks.delete(callback);

		if (callbacks.size === 0) {
			registry.delete(signal);
			watcher.unwatch(signal);
		}

		return removed;
	} else {
		return false;
	}
}


export function observeTextSignalRefs(root = document.body, { stack, signal, base = document } = {}) {
	if (typeof root === 'string') {
		return observeTextSignalRefs(base.getElementById(root), { stack, signal });
	} else {
		const it = root.ownerDocument.createNodeIterator(
			root,
			NodeFilter.SHOW_COMMENT,
			comment => hasSignalRef(comment.textContent.trim()) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
		);

		let comment;

		while ((comment = it.nextNode())) {
			const sig = getSignalFromRef(comment.textContent.trim());
			const textNode = root.ownerDocument.createTextNode(sig.get());
			comment.parentElement.replaceChild(textNode, comment);
			watchSignal(sig, text => textNode.textContent = text);
			stack?.defer?.(sig[Symbol.dispose]?.bind?.(sig));
			signal?.addEventListener?.('abort',sig[Symbol.dispose]?.bind?.(sig), { once: true });
		}

		return root;
	}
}

export function observeAttrSignalRefs(root = document.body, { stack, signal, base = document } = {}) {
	if (typeof root === 'string') {
		return observeAttrSignalRefs(base.getElementById(root), { stack, signal });
	} else {
		const els = root.querySelectorAll(`[${SIGNAL_DATA_ATTR}]`);

		for (const el of els) {
			const key = el.dataset.attrSignal;

			if (hasSignalRef(key)) {
				const sig = getSignalFromRef(key);
				const attr = root.ownerDocument.createAttribute(sig.name);
				attr.value = sig.get();
				el.setAttributeNode(attr);
				el.removeAttribute(SIGNAL_DATA_ATTR);
				watchSignal(sig, newVal => attr.value = newVal);
				stack?.defer?.(sig[Symbol.dispose]?.bind?.(sig));
				signal?.addEventListener?.('abort', sig[Symbol.dispose]?.bind?.(sig), { once: true });
			}
		}
	}

	return root;
}

export function observeSignalRefs(root = document.body, { stack, signal, base = document } = {}) {
	if (typeof root === 'string') {
		return observeSignalRefs(base.getElementById(root), { stack, signal });
	} else {
		observeTextSignalRefs(root, { stack, signal });
		observeAttrSignalRefs(root, { stack, signal });
		return root;
	}
}

export const $observe = observeSignalRefs;
