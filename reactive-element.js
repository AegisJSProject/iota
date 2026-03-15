import { createHTMLParser } from '@aegisjsproject/core/parsers/html.js';
import { css } from '@aegisjsproject/core/parsers/css.js';
import { sanitizer as sanitizerConfig } from '@aegisjsproject/sanitizer/config/base.js';
import { $render, $text } from '@aegisjsproject/iota';


// Need to force-allow comments for text signals until change is made in lib
const html = createHTMLParser({
	...sanitizerConfig,
	comments: true,
});

export class ReactiveElement extends HTMLElement {
	#shadow = this.attachShadow({ mode: 'open' });
	#internals = this.attachInternals();
	#stack = new DisposableStack();
	#controller = this.#stack.adopt(new AbortController(), controller => controller.abort());

	constructor() {
		super();

		if (this.styles instanceof CSSStyleSheet) {
			this.#shadow.adoptedStyleSheets = [this.styles];
		} else if (Array.isArray(this.styles)) {
			this.#shadow.adoptedStyleSheets = this.styles;
		} else if (typeof this.styles === 'string') {
			this.#shadow.adoptedStyleSheets = [css`${this.styles}`];
		}

		if (typeof this.render === 'function') {
			this.render('constructed', {
				stack: this.#stack,
				signal: this.#controller.signal,
				shadow: this.#shadow,
				internals: this.#internals,
				$render, html, css,
			});
		}
	}

	connectedCallback() {
		if (this.#stack.disposed) {
			this.#stack = new DisposableStack();
		}

		if (this.#controller.signal.aborted) {
			this.#controller = this.#stack.adopt(new AbortController(), controller => controller.abort());
		}

		if (this.html instanceof Node) {
			$render(this.html, this.#shadow);
		} else if (typeof this.html === 'string') {
			$render(html`${this.html}`, this.#shadow);
		}

		if (typeof this.render === 'function') {
			this.render('connected', {
				stack: this.#stack,
				signal: this.#controller.signal,
				shadow: this.#shadow,
				internals: this.#internals,
				$render, html, css,
			});
		}
	}

	adoptedCallback() {
		if (typeof this.render === 'function') {
			this.render('adopted', {
				stack: this.#stack,
				signal: this.#controller.signal,
				shadow: this.#shadow,
				internals: this.#internals,
			});
		}
	}

	disconnectedCallback() {
		if (typeof this.render === 'function') {
			this.render('disconnected', {
				stack: this.#stack,
				signal: this.#controller.signal,
				shadow: this.#shadow,
				internals: this.#internals,
			});
		}

		this.#stack.dispose();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (typeof this.render === 'function') {
			this.render('attributeChanged', {
				stack: this.#stack,
				signal: this.#controller.signal,
				shadow: this.#shadow,
				internals: this.#internals,
				attribute: { name, oldValue, newValue },
			});
		}
	}

	handleEvent(event) {
		if (typeof this.render === 'function') {
			this.render('eventDispatched', {
				stack: this.#stack,
				signal: this.#controller.signal,
				shadow: this.#shadow,
				internals: this.#internals,
				event,
			});
		}
	}

	[Symbol.dispose]() {
		if (typeof this.render === 'function') {
			this.render('dispose', {
				stack: this.#stack,
				signal: this.#controller.signal,
				shadow: this.#shadow,
				internals: this.#internals,
			});
		}
		this.#stack.dispose();
	}

	adopt(what, onDispose) {
		return this.#stack.adopt(what, onDispose);
	}

	use(what) {
		return this.#stack.use(what);
	}

	get disposed() {
		return this.#stack.disposed;
	}

	get signal() {
		return this.#controller.signal;
	}

	static register(tagName) {
		if (typeof tagName !== 'string' || ! tagName.includes('-')) {
			throw new TypeError('Tag name must be a non-empty string with a "-".');
		} else if (! customElements.get(tagName)) {
			customElements.define(tagName, this);
		}
	}
}

export class FancyCounter extends ReactiveElement {
	#count = $text(0);

	get count() { return Number(this.#count.get()); }

	set count(val) {
		this.#count.set(val);
	}

	increment(by = 1) {
		this.count += by;
	}

	get styles() {
		return css`
			:host { display: inline-block; padding: 1rem; border: 1px solid #ccc; border-radius: 8px; }
			button { cursor: pointer; padding: 0.5rem 1rem; }
			button:disabled { opacity: 0.5; cursor: not-allowed; }
			:host([inert]) button { opacity: 0.5; cursor: not-allowed; }
		`;
	}

	get html() {
		return html`
			<h3>Native Counter</h3>
			<button type="button" id="inc-btn" command="--increment">
				Count: ${this.#count}
			</button>
			<button type="button" id="del-btn" command="--dispose">
				Dispose
			</button>
		`;
	}

	render(phase, { stack, shadow, signal, event }) {
		if (phase === 'connected') {
			stack.use(this.#count);
			shadow.getElementById('inc-btn').commandForElement = this;
			shadow.getElementById('del-btn').commandForElement = this;
			this.addEventListener('command', this, { signal });
		} else if (phase === 'eventDispatched' && event.type === 'command') {
			switch(event.command) {
				case '--increment':
					this.increment();
					break;

				case '--dispose':
					this[Symbol.dispose]();
					break;
			}
		} else if (phase === 'disposed') {
			this.inert = true;
		}
	}
}

FancyCounter.register('fancy-counter');
