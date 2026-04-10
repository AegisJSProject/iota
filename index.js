import { $text, $disabled, $open, $hidden, $classList, $data, $aria, $log, $html, $render, $state, $watch } from '@aegisjsproject/iota';
import { onInput, onClick, observeEvents, createCallback, signal as signalAttr, registerSignal, onChange } from '@aegisjsproject/callback-registry';
import { el } from '@aegisjsproject/core/parsers/html.js';
import { css } from '@aegisjsproject/core/parsers/css.js';
import { IotaElement} from './iota-element.js';
import pkg from '/package.json' with { type: 'json' };
import reset from '@aegisjsproject/styles/css/reset.css' with { type: 'css' };
import layers from '@aegisjsproject/styles/css/layers.css' with { type: 'css' };
import presentation from '@aegisjsproject/styles/css/presentation.css' with { type: 'css' };
import properties from '@aegisjsproject/styles/css/properties.css' with { type: 'css' };
import theme from '@aegisjsproject/styles/css/theme.css' with { type: 'css' };
import misc from '@aegisjsproject/styles/css/misc.css' with { type: 'css' };
import forms from '@aegisjsproject/styles/css/forms.css' with { type: 'css' };
import btn from '@aegisjsproject/styles/css/button.css' with { type: 'css' };

document.title = pkg.name;
document.adoptedStyleSheets = [reset, layers, presentation, properties, theme, misc, forms, btn, css`hello-world {display: inline-block; min-height: 100px;}`];

const stack = new DisposableStack();
const controller = stack.adopt(new AbortController(), controller => controller.abort());
const signal = registerSignal(controller.signal);
const $name = stack.use($text('Silly person <script>alert("1")</script>'));
const $nameAttr = stack.use($data('user-name', () => $name.get()));
const $isHidden = stack.use($hidden(false));
const $desc = stack.use($aria('description', () => `Description for ${$name.get()}.`));
const $class = stack.use($classList(() => ['foo', 'bar', 'baz', $name.get()?.toLowerCase?.()?.trim?.()?.replaceAll?.(/\W/g, '-')]));
const $isDisabled = stack.use($disabled(false));
const $isOpen = stack.use($open(false));
const $script = stack.use($text('alert(location.href)'));
const toggleOpen = createCallback(() => $isOpen.set(! $isOpen.get()));
const toggleHidden = createCallback(() => $isHidden.set(! $isHidden.get()));
const themes = ['auto', 'light', 'dark'];
const $theme = stack.use($state(themes[0]));
const $color = $data('color', '#000');

navigator.share = (...args) => Promise.try(console.log, ...args);

// Set last, so runs first
stack.defer(() => $isDisabled.set(true));
$log($name, $isHidden, $isDisabled);
document.documentElement.dataset.theme = $theme.get();
$watch($theme, theme => document.documentElement.dataset.theme = theme);

class HelloWorld extends IotaElement {
	static shadowRootMode = 'closed';
	#name = this.use($text('World'));

	get name() {
		return this.#name.get();
	}

	set name(val) {
		if (typeof val === 'string' && val.length !== 0) {
			this.#name.set(val);
		}
	}

	get html() {
		return $html`
			<h2 part="greeting">Hello, ${this.#name}!</h2>
			<button type="button" class="btn btn-danger" command="--dispose">Dispose</button>
			<button type="button" class="btn btn-system-accent" command="--greet">Greet</button>
			<button type="button" class="btn btn-secondary" command="--theme">Toggle Theme</button>
		`;
	}

	get styles() {
		return [
			btn,
			css`:host {
				display: inline-block;
				min-height: 100px;
				min-width: 400px;
				padding: 0.8em 0.4em;
				box-sizing: border-box;
				margin: .8em;
				opacity: 1;
				transform: none;
				transition-property: opacity, transform;
				transition-duration: 600ms;
				transition-delay: ${Math.round(Math.random() * 1000)}ms;
				transition-timing-function: ease-out;
			}

			:host(:state(deferred)) {
				transform: scale(0) rotate(.05turn);
				opacity: 0;
			}

			:host(:state(disposed)) {
				opacity: 0.4;
			}`,
		];
	}

	update(type, { shadow, event }) {
		switch(type) {
			case 'connected':
				shadow.querySelectorAll('.btn[command]').forEach(btn => btn.commandForElement = this);
				break;

			case 'dispose':
				this.inert = true;
				shadow.querySelectorAll('.btn').forEach(btn => btn.disabled = true);
				break;

			case 'eventDispatched':
				if (event.type === 'command') {
					switch(event.command) {
						case '--greet':
							this.#greet();
							break;

						case '--theme':
							this.theme = this.theme === 'dark' ? 'light' : 'dark';
							break;
					}
				}
				break;
		}
	}

	async #greet() {
		const id = 'modal_' + crypto.randomUUID();
		const { promise, resolve } = Promise.withResolvers();

		const dialog = this.adopt(el`<dialog id=${id}>
			<p>Hello, ${this.#name.get()}!</p>
			<button type="button" class="btn btn-danger" command="close" commandfor="${id}">Dismiss</button>
		</dialog>`, dialog => dialog.close());
		dialog.addEventListener('close', ({ target }) => {
			target.remove();
			resolve();
		}, { once: true });

		document.body.append(dialog);
		dialog.showModal();

		await promise;
	}

	static create({ name, theme, loading }) {
		const el = new this();

		el.name = name;
		el.theme = theme;
		el.loading = loading;

		return el;
	}

	static {
		this.register('hello-world');
	}
}

// Sanitizer will not allow adding `<hello-world>` directly just yet...
$render($html`
	<h1 ${$isHidden} data-test="works">Hello, ${$name}!</h1>
	<p ${$color}>${pkg.description}</p>
	<script>${$script}</script>
	<form id="container" ${$class}>
		<div class="form-group">
			<label for="name" class="input-label required" ${$nameAttr}>Name</label>
			<input type="text" id="name" class="input" name="name" placeholder="Enter your name" ${onInput}="${createCallback($name.handleEvent)}"  ${signalAttr}="${signal}" ${$isDisabled} required="" />
		</div>
		<div class="form-group">
			<label for="color" class="input-label required">Pick a Color</label>
			<input type="color" id="color" class="input" value="${$color.get()}" ${onChange}="${({ target }) => target.validity.valid && $color.set(target.value)}" ${signalAttr}="${signal}" ${$isDisabled} />
		</div>
		<div>
			<button type="reset" class="btn btn-warning" ${$isDisabled}>Reset</button>
			<button type="button" class="btn btn-danger" command="--dispose" commandfor="root" ${$isDisabled}>Dispose</button>
			<button type="button" class="btn btn-system-accent" ${onClick}="${() => $theme.set(themes[(themes.indexOf($theme.get()) + 1) % themes.length])}">Toggle Theme</button>
		</div>
	</form>
	<hr />
	<button type="button" class="btn btn-primary" ${onClick}="${toggleOpen}" ${signalAttr}="${signal}"  ${$isDisabled}>Toggle Dialog</button>
	<button type="button" class="btn btn-warning" ${onClick}="${toggleHidden}" ${signalAttr}="${signal}"  ${$isDisabled}>Toggle Hidden</button>
	<dialog ${$isOpen}>
		<p>Lorem Ipsum</p>
		<p ${$desc}>The current name is <q>${$name}</p>
		<button type="button" class="btn btn-danger" ${onClick}="${toggleOpen}" ${$isDisabled}>Toggle</button>
	</dialog>
`, 'container');

document.documentElement.addEventListener('command', ({ source, command }) => {
	if (command === '--dispose') {
		stack.dispose();
		source.disabled = true;
	}
}, { signal: controller.signal });

const names = [
	null, 'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth',
	'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
	'Christopher', 'Lisa', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
	'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
	'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa', 'Timothy', 'Deborah',
	'Ronald', 'Stephanie', 'Edward', 'Rebecca', 'Jason', 'Sharon', 'Jeffrey', 'Laura', 'Ryan', 'Cynthia',
	'Jacob', 'Kathleen', 'Gary', 'Amy', 'Nicholas', 'Shirley', 'Eric', 'Angela', 'Jonathan', 'Helen',
	'Stephen', 'Anna', 'Larry', 'Brenda', 'Justin', 'Pamela', 'Scott', 'Emma', 'Brandon', 'Nicole',
	'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Gregory', 'Christine', 'Alexander', 'Debra', 'Frank', 'Rachel',
	'Patrick', 'Catherine', 'Raymond', 'Carolyn', 'Jack', 'Janet', 'Dennis', 'Ruth', 'Jerry', 'Maria',
];

document.body.append(...names.map(name => stack.use(HelloWorld.create({ name, loading: 'lazy', theme: Math.random() > 0.9 ? 'light' : 'dark' }))));

// This is called for an external library.
observeEvents();

globalThis.$name = $name;
globalThis.$isDisabled = $isDisabled;
globalThis.$isHidden = $isHidden;
globalThis.$class = $class;
