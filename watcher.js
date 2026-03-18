import { Signal } from '@shgysk8zer0/signals';
import { hasSignalRef, getSignalFromRef } from './registry.js';
import { SIGNAL_DATA_ATTR_SELECTOR, SIGNAL_DATA_ATTR } from './consts.js';

const ATTR_OWNER_KEY = Symbol('Attr:owner');

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
 * @typedef ObserverConfigObject
 * @property {DisposableStack|AsyncDisposable} [stack]
 * @property {AbortSignal} [signal]
 * @property {DocumentOrShadowRoot} [base=document]
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

/**
 *
 * @param @param {DocumentOrShadowRoot|Element|DocumentFragment|string} [root=document.body]
 * @param {ObserverConfigObject} [config]
 * @returns {DocumentOrShadowRoot|Element|DocumentFragment}
 */
export function observeTextSignalRefs(root = document.body, { stack, signal, base = document } = {}) {
	if (typeof root === 'string') {
		return observeTextSignalRefs(base.getElementById(root), { stack, signal });
	} else {
		const it = root.ownerDocument.createNodeIterator(
			root,
			NodeFilter.SHOW_COMMENT,
			comment => hasSignalRef(comment.textContent)
				&& comment.nextSibling?.nodeType === Node.TEXT_NODE
				&& comment.nextSibling.nextSibling?.nodeType === Node.COMMENT_NODE
				? NodeFilter.FILTER_ACCEPT
				: NodeFilter.FILTER_REJECT
		);

		let comment;

		while ((comment = it.nextNode())) {
			const sig = getSignalFromRef(comment.textContent.trim());
			// Get the text node between the comments & remove the surrounding comments
			const textNode = comment.nextSibling;
			textNode.nextSibling.remove();
			comment.remove();
			watchSignal(sig, text => textNode.textContent = text);
			stack?.defer?.(sig[Symbol.dispose]?.bind?.(sig));
			signal?.addEventListener?.('abort',sig[Symbol.dispose]?.bind?.(sig), { once: true });
		}

		return root;
	}
}

/**
 *
 * @param {DocumentOrShadowRoot|Element|DocumentFragment|string} [root=document.body]
 * @param {ObserverConfigObject} [config]
 * @returns {DocumentOrShadowRoot|Element|DocumentFragment}
 */
export function observeAttrSignalRefs(root = document.body, { stack, signal, base = document } = {}) {
	if (typeof root === 'string') {
		return observeAttrSignalRefs(base.getElementById(root), { stack, signal });
	} else {
		const els = root.querySelectorAll(SIGNAL_DATA_ATTR_SELECTOR);

		for (const el of els) {
			const key = el.dataset.attrSignal;

			if (hasSignalRef(key)) {
				const sig = getSignalFromRef(key);
				const attr = el.hasAttribute(sig.name) ? el.getAttributeNode(sig.name) : root.ownerDocument.createAttribute(sig.name);

				Object.defineProperty(attr, ATTR_OWNER_KEY, { value: el, enumerable: false, writable: false, configurable: false });
				el.removeAttribute(SIGNAL_DATA_ATTR);

				watchSignal(sig, newVal => {
					if (typeof newVal === 'boolean') {
						attr[ATTR_OWNER_KEY].toggleAttribute(attr.name, newVal);
					} else if (Array.isArray(newVal)) {
						attr.value = newVal.join(' ');

						if (! (attr.ownerElement instanceof Element)) {
							attr[ATTR_OWNER_KEY].setAttributeNode(attr);
						}
					} else {
						attr.value = newVal;

						if (! (attr.ownerElement instanceof Element)) {
							attr[ATTR_OWNER_KEY].setAttributeNode(attr);
						}
					}
				});

				stack?.defer?.(sig[Symbol.dispose]?.bind?.(sig));
				signal?.addEventListener?.('abort', sig[Symbol.dispose]?.bind?.(sig), { once: true });
			}
		}
	}

	return root;
}

/**
 *
 * @param {DocumentOrShadowRoot|Element|DocumentFragment|string} [root=document.body]
 * @param {ObserverConfigObject} [config]
 * @returns {DocumentOrShadowRoot}
 */
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

/**
 *
 * @param {Element|DocumentFragment} content
 * @param {string|Element|DocumentFragment|DocumentOrShadowRoot} target
 * @param {ObserverConfigObject} config
 * @returns {Element|DocumentFragment}
 */
export function $render(content, target = document.body, { stack, signal, base = document } = {}) {
	if (content instanceof HTMLTemplateElement) {
		return $render(content.content.cloneNode(true), target, { stack, signal, base });
	} else if (typeof target === 'string') {
		return $render(content, base.getElementById(target), { stack, signal, base });
	} else if (! (target instanceof Element || target instanceof DocumentFragment || target instanceof ShadowRoot)) {
		throw new TypeError('Target must be an element or an ID.');
	} else if (! (content instanceof Element || content instanceof DocumentFragment)) {
		throw new TypeError('Content must be an Element or DocumentFragment.');
	} else {
		$observe(content, { stack, signal });
		target.replaceChildren(content);
		return content;
	}
}

export const $sources = signal => Signal.subtle.introspectSources(signal);

export const $sinks = signal => Signal.subtle.introspectSinks(signal);

/**
 * Reads a Signal without tracking it
 * @template T
 * @param {Signal.State<T>|Signal.Computed<T>} signal
 * @returns {T}
 */
export const $peek = signal => Signal.subtle.untrack(() => signal.get());

export const $log = (...signals) =>
	Signal.subtle.untrack(() =>
		console.log(...signals.map(signal => signal.get()))
	);
