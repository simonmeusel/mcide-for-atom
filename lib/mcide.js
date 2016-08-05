'use babel';

import { CompositeDisposable } from 'atom';

const spawn = require('child_process').spawn;
const fs = require('fs');

export default {

  subscriptions: null,

  config: {
    indexFile: {
      type: 'string',
      description: 'Path to index php file (current for file which is open)',
      default: 'current'
    },
    packageFolder: {
      type: 'string',
      description: 'Path to index package folder (no slash at the end!)',
      default: '~/.atom/packages'
    },
    serverAddress: {
      type: 'string',
      description: 'Address of the McIDE server',
      default: '127.0.0.1'
    },
    serverPort: {
      type: 'integer',
      description: 'Port of the McIDE server',
      default: 25564,
      minimum: 0,
      maximum: 65535
    },
    allowAllCerts: {
      type: 'boolean',
      description: 'Implemented using python\' ssl.CERT_NONE (Needs python)',
      default: false
    },
    data: {
      type: 'object',
      description: 'Data to the McIDE server',
      properties: {
        world: {
          type: 'string',
          description: 'Name (or UUID) of the minecraft world',
          default: 'world'
        },
        password: {
          type: 'string',
          description: 'Password to connect to the minecraft McIDE server',
          default: ''
        }
      }
    }
  },

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'mcide:upload_secure': () => this.uploadSecure(),
      'mcide:upload_insecure': () => this.uploadInsecure(),
      'mcide:set_index_file': () => this.setIndexFile()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    return {};
  },

  uploadSecure() {
    var data = atom.config.get('mcide.data');

    var commands = "";

    var indexFile = atom.config.get('mcide.indexFile');
    if (indexFile == "current") {
      indexFile = atom.workspace.getActiveTextEditor().getPath();
    }
    fs.stat(indexFile, function(err, stats) {
      if (!stats.isFile()) {
        atom.notifications.addError("Index File is not a file", {
          detail: "Failed!",
          dismissable: true
        });
      } else {
        const php = spawn('php', [indexFile]);

        php.stdout.on('data', (data) => {
          commands = commands + data.toString();
        });

        php.stderr.on('data', (data) => {
          console.log(`stderr: ${data}`);
          atom.notifications.addError("Could not execute php", {
            detail: "See console: " + data.toString(),
            dismissable: true
          });
        });

        php.on('close', (code) => {
          data.commands = commands;

          atom.notifications.addInfo("Sending commands", {
            detail: commands,
            dismissable: true
          });

          data = JSON.stringify(data);

          console.log(data);

          if (atom.config.get('mcide.allowAllCerts')) {
            const trustall = spawn('python', [atom.config.get('mcide.packageFolder') + "/mcide/lib/trustall.py", atom.config.get('mcide.serverAddress'), atom.config.get('mcide.serverPort'), data]);
            trustall.stdout.on('data', (data) => {
              console.log(`stdout: ${data}`);
            });

            trustall.stderr.on('data', (data) => {
              console.log(`stderr: ${data}`);
            });

            trustall.on('close', (code) => {
              console.log(`child process exited with code ${code}`);
            });
          } else {
            var connection = new WebSocket('wss://' + atom.config.get('mcide.serverAddress') + ":" + atom.config.get('mcide.serverPort'), ['soap', 'xmpp']);
            connection.send(data);
          }
        });
      }
    });
  },

  uploadInsecure() {

  },

  setIndexFile() {
    currentFile = atom.workspace.getActiveTextEditor().getPath();
    if (currentFile == "") {
      atom.notifications.addWarning("Path of current File not available", {
        detail: "Could not set the index file",
        dismissable: true
      });
    } else {
      atom.config.set('mcide.indexFile', currentFile);
    }
  }

};
