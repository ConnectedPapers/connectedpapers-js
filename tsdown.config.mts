import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  target: 'node22',
  dts: {sourcemap: true},
  sourcemap: true,
  clean: true,
  exports: false,
  outExtensions({format}) {
    return {js: format === 'es' ? '.mjs' : '.js', dts: format === 'es' ? '.d.mts' : '.d.ts'};
  },
});
