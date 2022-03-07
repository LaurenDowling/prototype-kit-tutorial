module.exports = {
  framework: 'mocha+chai',
  parallel: 5,
  port: 1337,
  serve_files: ['build/scripts/main.js', 'build/scripts/tests.js'],
  routes: {
    '/browser-source-map-support.js': 'node_modules/source-map-support/browser-source-map-support.js',
  },
  test_page: 'src/tests/tests.mustache',

  on_start: {
    command: "kill -9 $(ps -A | grep BrowserStackLocal | grep -v grep | cut -d ' ' -f2); node start-BrowserStackLocal.js &",
    wait_for_text: 'Tunnel started',
    wait_for_text_timeout: 300000,
  },

  on_exit: './scripts/start-BrowserStackLocal.js `cat browserstack-local.pid`; rm browserstack-local.pid',

  launchers: {
    bs_mac_safari: {
      exe: './ci/tests/browserstack.js',
      args: ['OSX', 'Catalina', 'safari', '13.0', ''],
      protocol: 'browser',
    },

    bs_windows_10_IE_edge: {
      exe: './ci/tests/browserstack.js',
      args: ['Windows', '10', 'edge', 'latest', ''],
      protocol: 'browser',
    },

    bs_windows_10_chrome: {
      exe: './ci/tests/browserstack.js',
      args: ['Windows', '10', 'chrome', 'latest', ''],
      protocol: 'browser',
    },
  },

  launch_in_dev: ['chrome'],
  launch_in_ci: ['bs_mac_safari', 'bs_windows_10_IE_edge', 'bs_windows_10_chrome'],
};