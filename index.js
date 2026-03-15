import { $text, $render, $disabled, $open, $hidden, $classList, $data, $aria, $log } from '@aegisjsproject/iota';
import { html } from '@aegisjsproject/core/parsers/html.js';
import { onInput, onClick, observeEvents, createCallback, signal as signalAttr, registerSignal } from '@aegisjsproject/callback-registry';
// import pkg from '/package.json' with { type: 'json' }; // Wrong mime-type causes error
import properties from '@aegisjsproject/styles/css/properties.css' with { type: 'css' };
import theme from '@aegisjsproject/styles/css/theme.css' with { type: 'css' };
import misc from '@aegisjsproject/styles/css/misc.css' with { type: 'css' };
import forms from '@aegisjsproject/styles/css/forms.css' with { type: 'css' };
import btn from '@aegisjsproject/styles/css/button.css' with { type: 'css' };
import './reactive-element.js';

// document.title = pkg.name;
document.adoptedStyleSheets = [properties, theme, misc, forms, btn];

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
// Set last, so runs first
stack.defer(() => $isDisabled.set(true));
$log($name, $isHidden, $isDisabled);

$render(html`
	<h1 ${$isHidden} data-test="works">Hello, ${$name}!</h1>
	<script>${$script}</script>
	<form id="container" ${$class}>
		<div class="form-group">
			<label for="name" class="input-label required" ${$nameAttr}>Name</label>
			<input type="text" id="name" class="input" name="name" placeholder="Enter your name" ${onInput}="${createCallback($name.handleEvent)}"  ${signalAttr}="${signal}" ${$isDisabled} required="" />
		</div>
		<div>
			<button type="reset" class="btn btn-warning" ${$isDisabled}>Reset</button>
			<button type="button" class="btn btn-danger" command="--dispose" commandfor="root" ${$isDisabled}>Dispose</button>
		</div>
	</form>
	<hr />
	<button type="button" class="btn btn-primary" ${onClick}="${toggleOpen}" ${signalAttr}="${signal}"  ${$isDisabled}>Toggle Dialog</button>
	<button type="button" class="btn btn-warning" ${onClick}="${toggleHidden}" ${signalAttr}="${signal}"  ${$isDisabled}>Toggle Hidden</button>
	<dialog ${$isOpen}>
		<p>Lorem Ipsum</p>
		<p ${$desc}>The current name is <q>${$name}</q>
		<button type="button" class="btn btn-danger" ${onClick}="${toggleOpen}"  ${$isDisabled}>Toggle</button>
	</dialog>
`, 'container');

document.documentElement.addEventListener('command', ({ source, command }) => {
	if (command === '--dispose') {
		stack.dispose();
		source.disabled = true;
	}
}, { signal: controller.signal });

// This is called for an external library.
observeEvents();

globalThis.$name = $name;
globalThis.$isDisabled = $isDisabled;
globalThis.$isHidden = $isHidden;
globalThis.$class = $class;
