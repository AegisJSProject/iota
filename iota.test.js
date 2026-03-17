import '@shgysk8zer0/polyfills';
import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	getRef, RegistryKey,
} from './refs.js';
import { hasSignalRef, getSignalFromRef, unregisterSignal } from './registry.js';
import { $state, $computed, $proxy } from './disposable.js';
import { $watch, $unwatch } from './watcher.js';

test('RegistryKey generation and disposal', () => {
	const key = getRef('test');
	assert.ok(key instanceof RegistryKey);
	assert.match(key.toString(), /^test-\d+-[0-9a-f]+$/);
	assert.strictEqual(key.disposed, false);

	key[Symbol.dispose]();
	assert.strictEqual(key.disposed, true);
});

test('Signal Registry operations', () => {
	const state = $state(10);
	const ref = state.ref;

	assert.strictEqual(hasSignalRef(ref), true);
	assert.strictEqual(getSignalFromRef(ref), state);

	unregisterSignal(ref);
	assert.strictEqual(hasSignalRef(ref), false);
	assert.strictEqual(getSignalFromRef(ref), undefined);
});

test('$state (DisposableState) value tracking and disposal', () => {
	const count = $state(0);
	assert.strictEqual(count.get(), 0);

	count.set(5);
	assert.strictEqual(count.get(), 5);

	const ref = count.ref;
	assert.strictEqual(hasSignalRef(ref), true);

	count[Symbol.dispose]();
	assert.strictEqual(count.disposed, true);
	assert.strictEqual(hasSignalRef(ref), false); // Disposal should trigger unregister
});

test('$computed (DisposableComputed) reactivity and disposal', () => {
	const base = $state(5);
	const square = $computed(() => base.get() ** 2);

	assert.strictEqual(square.get(), 25);

	base.set(10);
	assert.strictEqual(square.get(), 100);

	const ref = square.ref;
	assert.strictEqual(hasSignalRef(ref), true);

	square[Symbol.dispose]();
	assert.strictEqual(square.disposed, true);
	assert.strictEqual(hasSignalRef(ref), false);
});

test('$watch and $unwatch microtask batching', async () => {
	const text = $state('a');
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

	assert.strictEqual(lastValue, 'd');
	assert.strictEqual(watcherRuns, 1); // Batched into a single run

	$unwatch(text);

	text.set('e');
	await new Promise(resolve => setTimeout(resolve, 0));

	assert.strictEqual(lastValue, 'd'); // Should not have updated
	assert.strictEqual(watcherRuns, 1);
});

describe('$proxy', () => {
	it('initializes and returns frozen object with signal, proxy, and dispose', () => {
		const result = $proxy({ a: 1, b: 2 });

		assert.strictEqual(Object.isFrozen(result), true);
		assert.ok('signal' in result);
		assert.ok('proxy' in result);
		assert.strictEqual(typeof result[Symbol.dispose], 'function');
	});

	it('retrieves values from the initial state', () => {
		const { proxy } = $proxy({ a: 1, b: 'test' });

		assert.strictEqual(proxy.a, 1);
		assert.strictEqual(proxy.b, 'test');
	});

	it('sets values and reflects them in the proxy and underlying signal', () => {
		const { proxy, signal } = $proxy({ a: 1 });

		proxy.a = 2;
		proxy.b = 3;

		assert.strictEqual(proxy.a, 2);
		assert.strictEqual(proxy.b, 3);
		assert.strictEqual(signal.get().a, 2);
		assert.strictEqual(signal.get().b, 3);
	});

	it('deletes properties correctly', () => {
		const { proxy, signal } = $proxy({ a: 1, b: 2 });

		delete proxy.a;

		assert.strictEqual(proxy.a, undefined);
		assert.strictEqual('a' in proxy, false);
		assert.strictEqual('a' in signal.get(), false);
	});

	it('correctly intercepts the "has" operator', () => {
		const { proxy } = $proxy({ a: 1 });

		assert.strictEqual('a' in proxy, true);
		assert.strictEqual('b' in proxy, false);
		assert.strictEqual(Symbol.dispose in proxy, true);
	});

	it('correctly intercepts ownKeys and getOwnPropertyDescriptor', () => {
		const { proxy } = $proxy({ a: 1, b: 2 });

		assert.deepEqual(Object.keys(proxy), ['a', 'b']);
		assert.deepEqual(Object.getOwnPropertyDescriptor(proxy, 'a').value, 1);
		assert.strictEqual(Object.getOwnPropertyDescriptor(proxy, 'a').enumerable, true);
	});

	it('revokes proxy when disposed', () => {
		const stack = new DisposableStack();
		const { proxy } = stack.use($proxy({ a: 1 }));

		stack.dispose();

		assert.throws(() => {
			proxy.a;
		}, TypeError);
	});
});
