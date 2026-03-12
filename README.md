# @aegisjsproject/iota

A zero-build, fine-grained reactivity library leveraging the TC39 Signals proposal. 

Iota delivers the microscopic DOM mutation performance of compiled frameworks (like Solid or Svelte) entirely at runtime. It bypasses the Virtual DOM by surgically targeting individual `Text` and `Attr` nodes, utilizing Explicit Resource Management (`DisposableStack`) for deterministic memory cleanup.

[![CodeQL](https://github.com/AegisJSProject/iota/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/AegisJSProject/iota/actions/workflows/codeql-analysis.yml)
![Node CI](https://github.com/AegisJSProject/iota/workflows/Node%20CI/badge.svg)
![Lint Code Base](https://github.com/AegisJSProject/iota/workflows/Lint%20Code%20Base/badge.svg)

[![GitHub license](https://img.shields.io/github/license/AegisJSProject/iota.svg)](https://github.com/AegisJSProject/iota/blob/master/LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/AegisJSProject/iota.svg)](https://github.com/AegisJSProject/iota/commits/master)
[![GitHub release](https://img.shields.io/github/release/AegisJSProject/iota?logo=github)](https://github.com/AegisJSProject/iota/releases)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/shgysk8zer0?logo=github)](https://github.com/sponsors/shgysk8zer0)

[![npm](https://img.shields.io/npm/v/@aegisjsproject/iota)](https://www.npmjs.com/package/@aegisjsproject/iota)
![node-current](https://img.shields.io/node/v/@aegisjsproject/iota)
![npm bundle size gzipped](https://img.shields.io/bundlephobia/minzip/@aegisjsproject/iota)
[![npm](https://img.shields.io/npm/dw/@aegisjsproject/iota?logo=npm)](https://www.npmjs.com/package/@aegisjsproject/iota)

[![GitHub followers](https://img.shields.io/github/followers/shgysk8zer0.svg?style=social)](https://github.com/shgysk8zer0)
![GitHub forks](https://img.shields.io/github/forks/AegisJSProject/iota.svg?style=social)
![GitHub stars](https://img.shields.io/github/stars/AegisJSProject/iota.svg?style=social)
[![Twitter Follow](https://img.shields.io/twitter/follow/shgysk8zer0.svg?style=social)](https://twitter.com/shgysk8zer0)

[![Donate using Liberapay](https://img.shields.io/liberapay/receives/shgysk8zer0.svg?logo=liberapay)](https://liberapay.com/shgysk8zer0/donate "Donate using Liberapay")
- - -

- [Code of Conduct](./.github/CODE_OF_CONDUCT.md)
- [Contributing](./.github/CONTRIBUTING.md)
<!-- - [Security Policy](./.github/SECURITY.md) -->

## Features

* **Zero-Build:** Runs natively in the browser. No compilers, no bundlers required.
* **Micro-Updates:** Mutates specific `Text` and `Attr` nodes. Re-renders are physically impossible.
* **Deterministic Cleanup:** Built-in memory management via `Symbol.dispose` and `DisposableStack` prevents zombie listeners.
* **Security by Default:** Bypasses `innerHTML` during reactive updates. By assigning directly to `Node.textContent` and `Attr.value`, markup injection is neutralized by the platform.
* **Web Component Native:** Designed to cleanly hydrate Shadow DOMs and standard elements alike.

## Installation

### NPM
```bash
npm install @aegisjsproject/iota
```

### `<script type="importmap">`
```html
<script type="importmap">
  "imports": {
    "@shgysk8zer0/signals": "https://unpkg.com/@shgysk8zer0/signals@0.0.3/signals.js,
    "@aegisjsproject/iota": "https://unpkg.com/@aegisjsproject/iota@1.0.1/iota.js"
  }
</script>
```
## Usage

Iota uses string placeholders (HTML comments and data-attributes) to position signals in your markup, which are then hydrated via `$observe()`.

```javascript
import { $text, $attr, $observe } from '@aegisjsproject/iota';
import { html } from '@aegisjsproject/core/parsers/html.js';
import { onInput, observeEvents } from '@aegisjsproject/callback-registry';
import { sanitizer as sanitizerConfig } from '@aegisjsproject/sanitizer/config/base.js';

// Manage lifecycle natively
const stack = new DisposableStack();

// Initialize signals and bind them to the stack
const $name = stack.use($text('World'));
const $value = stack.use($attr('value', () => $name.get()));

document.body.append(html`
    <h1>Hello, ${$name}!</h1>
    <form id="container">
        <input 
            type="text" 
            ${$value} 
            ${onInput}="${$name.handleEvent}" 
        />
        <button type="button" command="--dispose" commandfor="root">Dispose</button>
    </form>
`);

// Hydrate the DOM (replaces placeholders with live Text/Attr nodes)
$observe();
observeEvents();

// Tie disposal to a DOM event (e.g., Invoker Commands or unmount lifecycle)
document.addEventListener('command', ({ command }) => {
    if (command === '--dispose') stack.dispose();
});
```

## API Reference

### Primitives
* **`$text(value | computeFn)`**: Creates a `TextState` or `TextComputed` signal. Returns an HTML comment placeholder `<!--ref-->` when cast to a string.
* **`$attr(name, value | computeFn)`**: Creates an `AttrState` or `AttrComputed` signal. Returns a data-attribute placeholder `data-attr-signal="ref"` when cast to a string.
* **`$signal(value)`**: Creates a base `DisposableState`. Includes a `.handleEvent(e)` method that automatically updates the signal value from form inputs.
* **`$computed(fn)`**: Creates a base `DisposableComputed` signal.

### Observers & Hydration
* **`$observe(target = document.body, { stack, signal, base } = {})`**: Walks the target DOM node, locates signal placeholders, and replaces them with live, reactive `Text` and `Attr` nodes. 
* **`observeTextSignalRefs(...)`**: Hydrates only text nodes.
* **`observeAttrSignalRefs(...)`**: Hydrates only attribute nodes.

### Watchers
* **`$watch(signal, callback)`**: Manually subscribe to a signal.
* **`$unwatch(signal)`**: Stop tracking a specific signal.
* **`unwatchSignalCallback(signal, callback)`**: Remove a specific callback from a signal.

### Registry & Internal 
* **`RegistryKey`**: An extended `String` representing the signal's internal ID. Implements `[Symbol.dispose]` to automatically unwatch and unregister the associated signal when the stack clears.
* **`registerSignal(ref, signal)`** / **`unregisterSignal(ref)`**: Manages the global Map of active signals used during hydration.
