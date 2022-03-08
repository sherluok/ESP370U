import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import packageJson from './package.json';

export default [
  {
    input: 'src/index.ts',
    output: {
      file: packageJson.main,
      sourcemap: true,
      format: 'cjs',
    },
    plugins:[
      typescript({
        tsconfig: './tsconfig.json',
        compilerOptions: {
          target: 'ES2020',
        },
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      file: packageJson.module,
      sourcemap: true,
      format: 'es',
    },
    plugins:[
      typescript({
        tsconfig: './tsconfig.json',
        compilerOptions: {
          target: 'ES2022',
        },
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      file: packageJson.browser,
      sourcemap: true,
      name: 'esp370u',
      format: 'iife',
    },
    plugins: [
      terser(),
      typescript({
        tsconfig: './tsconfig.json',
        compilerOptions: {
          target: 'ES6',
        },
      }),
    ],
  }
];
