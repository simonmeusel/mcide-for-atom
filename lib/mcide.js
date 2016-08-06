'use babel';

import { CompositeDisposable } from 'atom';

const child_process = require('child_process');
const fs = require('fs');
const net = require('net');
const tls = require('tls');

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
      default: 25563,
      minimum: 0,
      maximum: 65535
    },
    rejectUnauthorized: {
      type: 'boolean',
      description: '(Only when using ssl) Should unautherizes certificates be rejected',
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

  /**
   * Uploads the outputs of index file to the McIDE server
   */
  uploadSecure() {
    let data = atom.config.get('mcide.data');
    let commands = self.getCommands();
    data.commands = commands;

    const client = tls.connect({
      host: atom.config.get('mcide.serverAddress'),
      port: atom.config.get('mcide.serverPort'),
      rejectUnauthorized: atom.config.get('mcide.rejectUnauthorized')
    }, () => {
      client.end(JSON.stringify(data) + "\n\n------***endofsequence***-------");

      atom.notifications.addInfo("Sent commands", {
        detail: commands,
        dismissable: true
      });
    });
  },

  uploadInsecure() {
    let data = atom.config.get('mcide.data');
    let commands = self.getCommands();
    data.commands = commands;

    const client = net.connect({
      host: atom.config.get('mcide.serverAddress'),
      port: atom.config.get('mcide.serverPort')
    }, () => {
      client.end(JSON.stringify(data) + "\n\n------***endofsequence***-------");

      atom.notifications.addInfo("Sent commands", {
        detail: commands,
        dismissable: true
      });
    });
  },


  /**
   * Sets the index file (in config) to the currently open file
   */
  setIndexFile() {
    currentFile = self.getCurrentFile();
    if (currentFile === "") {
      atom.notifications.addWarning("Path of current File not available", {
        detail: "Could not set the index file",
        dismissable: true
      });
    } else {
      atom.config.set('mcide.indexFile', currentFile);
    }
  },


  /**
   * Gets the index file path
   *
   * @return {string} path
   */
  getIndexFile() {
    let indexFile = atom.config.get('mcide.indexFile');

    if (indexFile == "current") {
      indexFile = self.getCurrentFile();
    }

    return indexFile;
  },

  /**
   * Checks if a path points to a file
   *
   * @param  {string} path file path
   * @return {boolean} path points to file
   */
  isFile(path) {
    const stat = fs.statSync(path);
    return stats.isFile();
  },

  /**
   * Returns the currently open file
   *
   * @return {string|null} Path to current file or null
   */
  getCurrentFile() {
    return atom.workspace.getActiveTextEditor().getPath();
  },

  /**
   * Returs the commands generated using php
   *
   * @return {string} output of php
   */
  getCommands() {
    const indexFile = self.getIndexFile();

    if (!self.isFile(indexFile)) {
      throw indexFile + " is not a File!";
    }

    const php = child_process.spawnSync('php', [indexFile]);

    const commands = php.stdout.toString('utf8');
    const error = php.stderr.toString('utf8');
    if (error) {
      throw error;
    }

    return commands;
  }

};
