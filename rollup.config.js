import terser from '@rollup/plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';
const external = [
	'@shgysk8zer0/signal', '@aegisjsproject/core/parsers/html.js', '@aegisjsproject/core/parsers/css.js', '@aegisjsproject/styles/reset.js',
	'@aegisjsproject/styles/theme.js', '@aegisjsproject/styles/layers.js',
];
export default [{
	input: 'iota.js',
	plugins: [nodeResolve()],
	external,
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
