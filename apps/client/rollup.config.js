import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default {
    input: 'dist/apps/client/main.mjs',
    output: {
        file: 'dist/apps/client/bundle.cjs',
        format: 'cjs',
        sourcemap: true
    },
    external: [
        "serialport",
    ],
    plugins: [
        nodeResolve(),
        typescript({
            tsconfig: "apps/client/tsconfig.json"
        }),
        json(),
        commonjs()
    ]
};