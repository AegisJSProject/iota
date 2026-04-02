import { html } from '@aegisjsproject/core/parsers/html.js';
import { css } from '@aegisjsproject/core/parsers/css.js';
import { $render } from './watcher.js';

/**
 * @type {WeakMap<Element, () => void}
 */
const loading = new WeakMap();

const intersectionObserver = new IntersectionObserver((entries, observer) => {
	entries.forEach(entry => {
		if (entry.isIntersecting && loading.has(entry.target)) {
			const resolve = loading.get(entry.target);
			resolve();
			loading.delete(entry.target);
			observer.unobserve(entry.target);
		}
	});
});

export class IotaElement extends HTMLElement {
	static shadowRootMode = 'open';
	static shadowRootClonable = false;
	static shadowRootDelegatesFocus = false;
	static shadowRootSerializable = false;
	static shadowRootSlotAssignment = 'named';
	static shadowRootReferenceTarget = null;
	static observedAttributes = ['loading'];

	#shadow = this.attachShadow({
		mode: this.constructor.shadowRootMode,
		clonable: this.constructor.shadowRootClonable,
		delegatesFocus: this.constructor.shadowRootDelegatesFocus,
		referenceTarget: this.constructor.shadowRootReferenceTarget, // No default value
		serializable: this.constructor.shadowRootSerializable,
		slotAssignment: this.constructor.shadowRootSlotAssignment,
	});

	#internals = this.attachInternals();
	#stack = new DisposableStack();
	#intersecting = Promise.resolve();
	#controller = this.#stack.adopt(
		new AbortController(),
		c => c.abort(new DOMException('Element was disposed.', 'AbortError'))
	);
	#attrChanges = new Map();
	#updating = false;
	#initialized = false;
	#updateRequests = new Map();
	#connected = Promise.withResolvers();
	#connectedIter = 0;

	async connectedCallback() {
		const iter = ++this.#connectedIter;

		if (this.#stack.disposed) {
			this.#stack = new DisposableStack();
		}

		if (this.#controller.signal.aborted) {
			this.#controller = this.#stack.adopt(new AbortController(), c => c.abort(new DOMException('Element disposed.', 'AbortError')));
		}

		// Always add this since parent class can handle events too
		this.addEventListener('command', this, { signal: this.#controller.signal });

		this.#internals.states.delete('disposed');

		if (! this.#initialized) {
			this.#initialized = true;
			this.#internals.states.add('deferred');
			this.#setStyles();
			await this.#intersecting;

			if (! this.#stack.disposed && iter === this.#connectedIter) {
				// Defer before setting content but after styles, which may set dimensions
				this.#setContent();
				this.#internals.states.delete('deferred');
			}
		}

		if (this.#stack.disposed) {
			this.#initialized = false;
		} else if (iter === this.#connectedIter) {
			await this.#runUpdate('connected', {
				signal: this.#controller.signal,
				shadow: this.#shadow,
				internals: this.#internals,
			});

			this.#internals.states.add('ready');
			this.#connected.resolve(this);
		}
	}

	adoptedCallback() {
		this.#runUpdate('adopted', {
			signal: this.#controller.signal,
			shadow: this.#shadow,
			internals: this.#internals,
		});
	}

	async disconnectedCallback() {
		this.#connected = Promise.withResolvers();

		await this.#runUpdate('disconnected', {
			signal: this.#controller.signal,
			shadow: this.#shadow,
			internals: this.#internals,
		});

		this[Symbol.dispose]();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'loading' && newValue === 'lazy') {
			const { promise, resolve } = Promise.withResolvers();
			loading.set(this, resolve);
			this.#intersecting = promise;
			intersectionObserver.observe(this);
		} else if (name === 'loading' && loading.has(this)) {
			const resolve = loading.get(this);
			loading.delete(this);
			intersectionObserver.unobserve(this);
			resolve();
		} else {
			this.#attrChanges.set(name, { newValue, oldValue });

			if (! this.#updating) {
				this.#updating = true;

				queueMicrotask(() => {
					const attributes = Object.fromEntries(this.#attrChanges);
					this.#attrChanges.clear();
					this.#updating = false;

					this.#runUpdate('attributeChanged', {
						signal: this.#controller.signal,
						shadow: this.#shadow,
						internals: this.#internals,
						attributes,
					});
				});
			}
		}
	}

	get loading() {
		return this.getAttribute('loading') ?? 'auto';
	}

	set loading(val) {
		if (typeof val === 'string' && val.length !== 0) {
			this.setAttribute('loading', val);
		}
	}

	get theme() {
		return this.getAttribute('theme') ?? 'auto';
	}

	set theme(val) {
		if (typeof val === 'string' && val.length !== 0) {
			this.setAttribute('theme', val);
		} else {
			this.removeAttribute('theme');
		}
	}

	get whenIntersecting() {
		return this.#intersecting;
	}

	handleEvent(event) {
		if (! (event instanceof Event)) {
			this.#throw(new TypeError('Handle event did not receive an event.'));
		} else if (! this.#stack.disposed) {
			if (event.type === 'command' && event.command === '--dispose') {
				this[Symbol.dispose]();
			} else if (event.type === 'command' && event.command === '--request-dispose') {
				const req = new Event('requestdispose', { cancelable: true, bubbles: false });
				this.dispatchEvent(req);

				if (! req.defaultPrevented) {
					this[Symbol.dispose]();
				}
			} else {
				this.#runUpdate('eventDispatched', {
					signal: this.#controller.signal,
					shadow: this.#shadow,
					internals: this.#internals,
					event,
				});
			}
		} else {
			this.removeEventListener(event.type, this);
		}
	}

	[Symbol.dispose]() {
		this.#runUpdate('dispose', {
			signal: this.#controller.signal,
			shadow: this.#shadow,
			internals: this.#internals,
		});

		if (loading.has(this)) {
			const resolve = loading.get(this);
			resolve();
			intersectionObserver.unobserve(this);
			loading.delete(this);
			this.#intersecting = Promise.resolve();
			this.#internals.states.delete('deferred');
		}

		this.#attrChanges.clear();
		this.#stack.dispose();
		this.#updateRequests.clear();
		this.#internals.states.add('disposed');
		this.#internals.states.delete('ready');
	}

	adopt(what, onDispose) {
		return this.#stack.adopt(what, onDispose);
	}

	abort(reason) {
		this.#controller.abort(reason);
	}

	defer(onDispose) {
		this.#stack.defer(onDispose);
	}

	requestUpdate(type, context = {}) {
		if (! this.#stack.disposed) {
			// If size !== 0, already scheduled
			if (this.#updateRequests.size === 0) {
				this.#updateRequests.set(type, context);
				queueMicrotask(() => {
					const requests = Object.fromEntries(this.#updateRequests);
					this.#updateRequests.clear();

					this.#runUpdate('custom', {
						signal: this.#controller.signal,
						shadow: this.#shadow,
						internals: this.#internals,
						requests,
					});
				});
			} else if (this.#updateRequests.has(type)) {
				const oldContext = this.#updateRequests.get(type);
				this.#updateRequests.set(type, { ...oldContext, ...context });
			} else {
				this.#updateRequests.set(type, context);
			}
		}
	}

	use(what) {
		return this.#stack.use(what);
	}

	#throw(err) {
		if (Error.isError(err)) {
			this.dispatchEvent(new ErrorEvent('error', { message: err.message, error: err }));
		} else {
			const type = typeof err === 'object' ? err?.constructor?.name ?? 'null' : typeof err;
			const e = new TypeError(`#throw expects an Error but got a ${type}.`, { cause: err });
			this.dispatchEvent(new ErrorEvent('error', { message: e.message, error: e }));
		}
	}

	async #runUpdate(type, context = {}) {
		if (typeof this.update === 'function' && ! this.#stack.disposed) {
			const stack = new AsyncDisposableStack();
			context.stack = stack;

			await Promise.try(() => this.update(type, context))
				.catch(err => this.#throw(err))
				.finally(() => stack.disposeAsync());
		}
	}

	#setContent() {
		if (this.html instanceof Node) {
			$render(this.html, this.#shadow);
		} else if (typeof this.html === 'string') {
			$render(html`${this.html}`, this.#shadow);
		}
	}

	#setStyles() {
		if (this.styles instanceof CSSStyleSheet) {
			this.#shadow.adoptedStyleSheets = [this.styles];
		} else if (Array.isArray(this.styles)) {
			this.#shadow.adoptedStyleSheets = this.styles;
		} else if (typeof this.styles === 'string') {
			this.#shadow.adoptedStyleSheets = [css`${this.styles}`];
		}
	}

	get aborted() {
		return this.#controller.signal.aborted;
	}

	get disposed() {
		return this.#stack.disposed;
	}

	get signal() {
		return this.#controller.signal;
	}

	static register(tagName, {
		registry = globalThis?.customElements,
		...options
	} = {}) {
		if (typeof tagName !== 'string' || ! tagName.includes('-')) {
			throw new TypeError('Tag name must be a non-empty string with a "-".');
		} else if (! registry.get(tagName)) {
			registry.define(tagName, this, options);
			return true;
		} else {
			return registry.get(tagName) === this;
		}
	}
};
