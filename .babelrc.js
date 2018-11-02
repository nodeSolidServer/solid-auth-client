const ignore = [
  '**/__test__/**',
]
const presets = [
  ["@babel/flow"],
  ["@babel/react"],
  ["@babel/env"],
]
const plugins = [
  "@babel/plugin-transform-runtime",
  "@babel/plugin-proposal-object-rest-spread",
  "@babel/plugin-proposal-class-properties",
]

module.exports = {
  env: {
    development: {
      ignore,
      presets,
      plugins,
    },
    production: {
      ignore,
      presets,
      plugins,
    },
    test: {
      presets,
      plugins,
    },
    module: {
      ignore,
      presets: [
        ["@babel/flow"],
        ["@babel/env", { targets: '', modules: false }],
      ],
      plugins,
    },
  }
}
