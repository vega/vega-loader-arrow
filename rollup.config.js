import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default [{
  input: 'src/index.js',
  plugins: [nodeResolve({ modulesOnly: true }), terser({ ecma: 2018 })],
  output: {
    file: 'build/vega-loader-arrow.min.js',
    format: 'umd',
    sourcemap: true,
    name: 'vega.format.arrow',
  }
}];

