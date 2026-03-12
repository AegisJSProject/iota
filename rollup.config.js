import terser from '@rollup/plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';

export default [{
	input: 'iota.js',
	plugins: [nodeResolve()],
	external: ['@shgysk8zer0/signals'],
	output: [{
		file: 'iota.cjs',
		format: 'cjs',
	}, {
		file: 'iota.min.js',
		format: 'module',
		plugins: [terser()],
		sourcemap: true,
	}],
}];
