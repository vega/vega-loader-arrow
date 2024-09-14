import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const name = 'vega.format.arrow';
const plugins = [
  nodeResolve({ modulesOnly: true })
];

export default [
  {
    input: 'src/index.js',
    plugins,
    output: [
      {
        file: 'build/vega-loader-arrow.cjs',
        format: 'cjs'
      },
      {
        file: 'build/vega-loader-arrow.min.js',
        format: 'umd',
        sourcemap: true,
        plugins: [ terser({ ecma: 2018 }) ],
        name
      }
    ]
  }
];
