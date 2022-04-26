<div align="center">
  <h1>Env-Config-Synchroize-Webpack-Plugin</h1>
  <p>Plugin that check the env config for your project</p>
</div>

#### Install
```
npm i EnvironmentConfigSynchroizePlugin
```

#### Config
webpack.config.js
```
const EnvironmentConfigSynchronizePlugin = require("./EnvironmentConfigSynchronizePlugin");
module.exports = {
  plugins: [
    new EnvironmentConfigSynchronizePlugin({
      path: "src/config",
      env: ["DEV", "SIT"],
      include: /.js|json|ts/
    })
  ]
}
```
#### Parameters

|Parameter Name|Description|Type|Remark|
|-----|-----|-----|-----|
|path|Choose the config path|String|-|
|env|Support environment list|Array\<String\>|-|
|include|RegExp of file|RegExp|-|