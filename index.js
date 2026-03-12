import { $text, $attr, $observe } from '@aegisjsproject/iota';
import { createHTMLParser } from '@aegisjsproject/core/parsers/html.js';
import { onInput, observeEvents, createCallback } from '@aegisjsproject/callback-registry';
import { sanitizer as sanitizerConfig } from '@aegisjsproject/sanitizer/config/base.js';
// import pkg from '/package.json' with { type: 'json' }; // Wrong mime-type causes error
import properties from '@aegisjsproject/styles/css/properties.css' with { type: 'css' };
import theme from '@aegisjsproject/styles/css/theme.css' with { type: 'css' };
import misc from '@aegisjsproject/styles/css/misc.css' with { type: 'css' };
import forms from '@aegisjsproject/styles/css/forms.css' with { type: 'css' };
import btn from '@aegisjsproject/styles/css/button.css' with { type: 'css' };

// document.title = pkg.name;
document.adoptedStyleSheets = [properties, theme, misc, forms, btn];

// Need to force-allow comments for text signals
const html = createHTMLParser({
	...sanitizerConfig,
	comments: true,
});

const stack = new DisposableStack();
const controller = stack.adopt(new AbortController(), controller => controller.abort());
const $name = stack.use($text('Silly person'));
const $value = stack.use($attr('value', () => $name.get()));

document.getElementById('main').prepend(html`<h1>Hello, ${$name}!</h1>
	<form id="container">
		<div class="form-group">
			<label for="name" class="input-label required">Name</label>
			<input type="text" id="name" class="input" name="name" ${$value} placeholder="Enter your name" ${onInput}="${createCallback($name.handleEvent)}" required="" />
		</div>
		<div>
			<button type="reset" class="btn btn-warning">Reset</button>
			<button type="button" class="btn btn-danger" command="--dispose" commandfor="root">Dispose</button>
		</div>
	</form>
`);

document.documentElement.addEventListener('command', ({ source, command }) => {
	if (command === '--dispose') {
		stack.dispose();
		source.disabled = true;
	}
}, { signal: controller.signal });

stack.defer(() => {
	for (const el of document.forms.container.elements) {
		el.disabled = true;
	}
});

$observe();
observeEvents();
