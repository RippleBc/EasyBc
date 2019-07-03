module.exports = function (api) {
  api.cache(true);

  const presets = [
    ["env", {
      targets: {
        browsers: [ "ie >= 8", "chrome >= 62" ]
      }      
    }]
  ];
  const plugins = [ 
    
  ];

  return {
    presets,
    plugins
  };
}