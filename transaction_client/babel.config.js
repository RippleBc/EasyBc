module.exports = {
  presets: [
    '@vue/app'
  ],
  "plugins": [
	  "@babel/plugin-transform-runtime",
		"@babel/plugin-syntax-dynamic-import",
    [
      "component",
      {
        "libraryName": "element-ui",
        "styleLibraryName": "theme-chalk"
      }
    ]
  ]
}
