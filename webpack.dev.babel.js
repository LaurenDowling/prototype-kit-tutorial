import * as path from 'path';
import * as os from 'os';
import merge from 'webpack-merge';
import LiveReloadPlugin from 'webpack-livereload-plugin';
import chalk from 'chalk';

import commonConfig from './webpack.common';

const mode = 'development';
const port = 3000;
const common = commonConfig(mode);

function getIP () {
  const interfaces = os.networkInterfaces();
  let interfaceArray = [];

  for (let key in interfaces) {
    if (interfaces.hasOwnProperty(key)) {
      interfaceArray = interfaceArray.concat(interfaces[key]);
    }
  }

  const _interface = interfaceArray.filter(
    _interface =>
      _interface.family === 'IPv4' && _interface.address !== '127.0.0.1'
  )[0];

  return _interface ? _interface.address : 'localhost';
}

const serverSettings = {
  devServer: {
    contentBase: path.join(__dirname, 'build'),
    compress: false,
    port,
    after: function () {
      setTimeout(() => {
        console.log(chalk.blue.bold('======================================='));
        console.log(chalk.bold.cyan('Server started'));
        console.log(
          `${chalk.bold.cyan('Local:')} ${chalk.bold.green(
            `http://localhost:${port}`
          )}`
        );
        console.log(
          `${chalk.bold.cyan('Remote:')} ${chalk.bold.green(
            `http://${getIP()}:${port}`
          )}`
        );
        console.log(chalk.blue.bold('======================================='));
      }, 2000);
    }
  },

  plugins: [new LiveReloadPlugin()]
};

export default [
  merge(common.nonJs, serverSettings),
  merge(common.es2015plus, serverSettings),
  merge(common.es5, serverSettings)
];