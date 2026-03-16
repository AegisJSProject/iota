import '@shgysk8zer0/polyfills';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	getRef, RegistryKey,
} from './refs.js';
import { hasSignalRef, getSignalFromRef, unregisterSignal } from './registry.js';
import { $signal, $computed } from './disposable.js';
import { $watch, $unwatch } from './watcher.js';

test('RegistryKey generation and disposal', () => {
	const key = getRef('test');
	assert.ok(key instanceof RegistryKey);
	assert.match(key.toString(), /^test-\d+-[0-9a-f]+$/);
	assert.equal(key.disposed, false);

	key[Symbol.dispose]();
	assert.equal(key.disposed, true);
});

test('Signal Registry operations', () => {
	const state = $signal(10);
	const ref = state.ref;

	assert.equal(hasSignalRef(ref), true);
	assert.equal(getSignalFromRef(ref), state);

	unregisterSignal(ref);
	assert.equal(hasSignalRef(ref), false);
	assert.equal(getSignalFromRef(ref), undefined);
});

test('$signal (DisposableState) value tracking and disposal', () => {
	const count = $signal(0);
	assert.equal(count.get(), 0);

	count.set(5);
	assert.equal(count.get(), 5);

	const ref = count.ref;
	assert.equal(hasSignalRef(ref), true);

	count[Symbol.dispose]();
	assert.equal(count.disposed, true);
	assert.equal(hasSignalRef(ref), false); // Disposal should trigger unregister
});

test('$computed (DisposableComputed) reactivity and disposal', () => {
	const base = $signal(5);
	const square = $computed(() => base.get() ** 2);

	assert.equal(square.get(), 25);

	base.set(10);
	assert.equal(square.get(), 100);

	const ref = square.ref;
	assert.equal(hasSignalRef(ref), true);

	square[Symbol.dispose]();
	assert.equal(square.disposed, true);
	assert.equal(hasSignalRef(ref), false);
});

test('$watch and $unwatch microtask batching', async () => {
	const text = $signal('a');
	let watcherRuns = 0;
	let lastValue = null;

	const callback = (val) => {
		watcherRuns++;
		lastValue = val;
	};

	$watch(text, callback);

	// Trigger multiple synchronous updates
	text.set('b');
	text.set('c');
	text.set('d');

	// Yield to event loop to allow queueMicrotask to process
	await new Promise(resolve => setTimeout(resolve, 0));

	assert.equal(lastValue, 'd');
	assert.equal(watcherRuns, 1); // Batched into a single run

	$unwatch(text);

	text.set('e');
	await new Promise(resolve => setTimeout(resolve, 0));

	assert.equal(lastValue, 'd'); // Should not have updated
	assert.equal(watcherRuns, 1);
});
