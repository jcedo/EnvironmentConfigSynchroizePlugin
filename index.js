/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author: MADAO LI
*/

'use strict'

require("@babel/register");

const fs = require("fs");
const _ = require("lodash");
const path = require("path");
class EnvironmentConfigSynchronizePlugin {

  /**
   * 
   * @param {
   *  {
   *    path: string,
   *    env: Array<string>
   *  }
   * } options 
   * 
   */

  constructor(options) {
    this.userOption = options || {};
    this.version = EnvironmentConfigSynchronizePlugin.version;
    this.configPath = "";
  }

  apply(compiler) {

    compiler.hooks.initialize.tap("EnvironmentConfigSynchronizePlugin", async () => {
      const userOption = this.userOption;

      if (!userOption.path || !userOption.env) {
        throw new Error("EnvironemntConfigSynchronizePlugin: please check your \"path\" and \"env\" config");
      }

      if (!(userOption.env instanceof Array)) {
        throw new Error("EnvironemntConfigSynchronizePlugin: \"env\" need to be a array type, and inside is folder name under \"path\"");
      }

      // Just exist one environment, no need to synchroinze.
      if (userOption.env.length === 1 || userOption.env.length === 0) {
        console.log("[EnvironemntConfigSynchronizePlugin]: the number of env is 1/0, no need to synchronize");
        return;
      }

      const contextPath = compiler.context;
      const configPath = path.resolve(contextPath, userOption.path);
      this.configPath = configPath;

      // Check folder name whether exist
      const configFolderDir = fs.readdirSync(configPath);
      for (const envFolder of userOption.env) {
        if (!configFolderDir.includes(envFolder)) {
          throw new Error("EnvironemntConfigSynchronizePlugin: can not find the folder name: " + envFolder);
        }
      }
      // Load all folder file tree in env.The configEnvFileTreeArray should be Array<Array<{string}>>.
      const configEnvFileTreeArray = [];
      for (const envFolder of userOption.env) {
        configEnvFileTreeArray.push(
          {
            envName: envFolder,
            fileTreeList: this.loadFileTree(path.resolve(configPath, envFolder))
          }
        );
      }
      // check the length of each item in configEnvFileTreeArray.
      if (configEnvFileTreeArray.length) {
        const firstLen = configEnvFileTreeArray[0].fileTreeList.length;
        const len = configEnvFileTreeArray.length
        for (let i = 1; i < len; i++) {
          if (configEnvFileTreeArray[i].fileTreeList.length !== firstLen) {
            this.notify("Length difference");
            return;
          }
          EnvironmentConfigSynchronizePlugin.sortFileTreeByName(configEnvFileTreeArray[i].fileTreeList);
        }
      }
      // Compare each array the relative path
      {
        const firstRelativeFileTreeList = EnvironmentConfigSynchronizePlugin.relative(
          configEnvFileTreeArray[0].fileTreeList,
          path.join(configPath, configEnvFileTreeArray[0].envName)
        );
        for (let i = 1; i < configEnvFileTreeArray.length; i++) {
          const indexRelativeFileTreeList = EnvironmentConfigSynchronizePlugin.relative(configEnvFileTreeArray[i].fileTreeList, path.join(configPath, configEnvFileTreeArray[i].envName));
          if (EnvironmentConfigSynchronizePlugin.arrayIsEqual(indexRelativeFileTreeList, firstRelativeFileTreeList)) {
            this.notify("Relative path file name difference");
            return;
          }
        }
      }
      // Check each file output
      {
        const inlcude = this.userOption.include;
        const fileTreeListLen = configEnvFileTreeArray[0].fileTreeList.length;
        // const A = require(configEnvFileTreeArray[0].fileTreeList[0]);
        let firstExport = null;
        let indexExport = null
        for (let i = 0; i < fileTreeListLen; i++) {
          firstExport = require(configEnvFileTreeArray[0].fileTreeList[i]);
          for (let j = 1; j < configEnvFileTreeArray.length; j++) {
            indexExport = require(configEnvFileTreeArray[j].fileTreeList[i]);
            if (!EnvironmentConfigSynchronizePlugin.arrayIsEqual(Object.keys(firstExport), Object.keys(indexExport))) {
              this.notify("Difference export between " + configEnvFileTreeArray[0].fileTreeList[i] + " and " + configEnvFileTreeArray[j].fileTreeList[i]);
              return;
            }
            if (!EnvironmentConfigSynchronizePlugin.arrayIsEqual(Object.keys(firstExport["default"]), Object.keys(indexExport["default"]))) {
              this.notify("Difference export default between " + configEnvFileTreeArray[0].fileTreeList[i] + " and " + configEnvFileTreeArray[j].fileTreeList[i]);
              return;
            }
          }
          
        }
      }
    });
  }

  /**
   * Sort item of array by name
   * @param {Array<string>} arr 
   * @return {void}
   */
  static sortFileTreeByName(arr) {
    arr.sort(function (a, b) {
      return a - b;
    })
  }

  /**
   * 
   * @param {Array<string>} arr which contain the absolutePath
   * @param {string} relativePath dir to get relative path
   * @return {Array<string>}
   */
  static relative(arr, relativePath) {
    return arr.map(function (absolutePath) {
      return path.relative(relativePath, absolutePath);
    });
  }

  /**
   * 
   * @param {Array<string>} arr1
   * @param {Array<string>} arr2
   * @return {boolean}
   */
  static arrayIsEqual(arr1, arr2) {
    return _.isEqualWith(arr1, arr2, function (val1, val2) {
      return val1 === val2;
    });
  }

  /**
   * A function to parse the tree under the environment folder, will list the absolutePath in return array.
   * @param {string} absolutePath 
   * @return {Array}
   */
  loadFileTree(absolutePath) {
    const stat = fs.lstatSync(absolutePath);
    let resultlArr = [];
    if (stat.isFile()) {
      resultlArr = [absolutePath];
    } else if (stat.isDirectory()) {
      const configFolderDir = fs.readdirSync(absolutePath);
      for (const file of configFolderDir) {
        resultlArr = resultlArr.concat(
          this.loadFileTree(path.resolve(absolutePath, file))
        );
      }
    }
    return resultlArr;
  }

  /**
   * Will trigger the program exit and print the info in console
   */
  notify(temp) {
    console.error("[EnvironemntConfigSynchronizePlugin]: notify user by saying difference");
    console.log(temp);
    process.exit(1);
  }
}

EnvironmentConfigSynchronizePlugin.version = 1;

module.exports = EnvironmentConfigSynchronizePlugin;