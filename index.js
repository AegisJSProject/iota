import { $text, $attr, $render } from '@aegisjsproject/iota';
import { createHTMLParser } from '@aegisjsproject/core/parsers/html.js';
import { onInput, onClick, observeEvents, createCallback, signal as signalAttr, registerSignal } from '@aegisjsproject/callback-registry';
import { sanitizer as sanitizerConfig } from '@aegisjsproject/sanitizer/config/base.js';
// import pkg from '/package.json' with { type: 'json' }; // Wrong mime-type causes error
import properties from '@aegisjsproject/styles/css/properties.css' with { type: 'css' };
import theme from '@aegisjsproject/styles/css/theme.css' with { type: 'css' };
import misc from '@aegisjsproject/styles/css/misc.css' with { type: 'css' };
import forms from '@aegisjsproject/styles/css/forms.css' with { type: 'css' };
import btn from '@aegisjsproject/styles/css/button.css' with { type: 'css' };
import './reactive-element.js';

// document.title = pkg.name;
document.adoptedStyleSheets = [properties, theme, misc, forms, btn];

// Need to force-allow comments for text signals until change is made in lib
const html = createHTMLParser({
	...sanitizerConfig,
	comments: true,
});

const stack = new DisposableStack();
const controller = stack.adopt(new AbortController(), controller => controller.abort());
const signal = registerSignal(controller.signal);
const $name = stack.use($text('Silly person'));
const $hidden = stack.use($attr('hidden', false));
const $open = stack.use($attr('open', false));
const $disabled = $attr('disabled', false);
const $script = $text('alert(location.href)');
const toggleOpen = createCallback(() => $open.set(! $open.get()));
const toggleHidden = createCallback(() => $hidden.set(! $hidden.get()));
stack.defer(() => $disabled.set(true));

$render(html`
	<h1 ${$hidden}>Hello, ${$name}!</h1>
	<script>${$script}</script>
	<form id="container">
		<div class="form-group">
			<label for="name" class="input-label required">Name</label>
			<input type="text" id="name" class="input" name="name" placeholder="Enter your name" ${onInput}="${createCallback($name.handleEvent)}"  ${signalAttr}="${signal}" ${$disabled} required="" />
		</div>
		<div>
			<button type="reset" class="btn btn-warning" ${$disabled}>Reset</button>
			<button type="button" class="btn btn-danger" command="--dispose" commandfor="root" ${$disabled}>Dispose</button>
		</div>
	</form>
	<button type="button" class="btn btn-primary" ${onClick}="${toggleOpen}" ${signalAttr}="${signal}"  ${$disabled}>Toggle Dialog</button>
	<button type="button" class="btn btn-warning" ${onClick}="${toggleHidden}" ${signalAttr}="${signal}"  ${$disabled}>Toggle Hidden</button>
	<dialog ${$open}>
		<p>Lorem Ipsum</p>
		<button type="button" class="btn btn-danger" ${onClick}="${toggleOpen}"  ${$disabled}>Toggle</button>
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
