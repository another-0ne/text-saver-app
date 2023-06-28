/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { app, BrowserView, BrowserWindow, shell, ipcMain } from 'electron';
import path from 'path';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  const view = new BrowserView();
  mainWindow.setBrowserView(view);
  view.setAutoResize({ width: false, height: true });
  view.setBounds({ x: 630, y: 170, width: 350, height: 500 });
  view.setBackgroundColor('#fff');
  view.webContents.loadURL('https://google.com');

  ipcMain.on('open-url', (event, url) => {
    view.webContents.loadURL(url);
  });

  view.webContents.on('dom-ready', () => {
    view.webContents.executeJavaScript(`
      const button = document.createElement('button');
      button.id = 'btn'
      button.innerText = 'Save highlight';
      button.style.backgroundColor = 'grey';
      button.style.padding = '10px 20px';
      button.style.borderRadius = '10px';
      button.style.border = 'none';
      button.style.appearance = 'none';
      button.style.fontSize = '1.3rem';
      button.style.position = 'fixed';
      button.style.bottom = '15%';
      button.style.left = '50%';
      button.style.transform = 'translate(-50%, -15%)';
      button.style.cursor = 'pointer';

      button.addEventListener('click', () => {
        const text = window.getSelection().toString();
        const title = document.title;
        const url = window.location.href;

        const savedItem = {
          url,
          title,
          text,
        }

        alert('Selected Text: ' + JSON.stringify(savedItem));
      });

      document.body.appendChild(button);

      document.addEventListener('selectionchange', () => {
      const selectedText = window.getSelection().toString();
      button.disabled = selectedText ? false : true;
      });
    `);

    // code below supposed to send saved data to renderer process on button click but I didn't find a right way how to do this:(
    // @ts-ignore
    // mainWindow.webContents.send('ipc-example', JSON.stringify({
    //     url: 'https://www.electronjs.org/',
    //     title:
    //       'uild cross-platform desktop apps with JavaScript, HTML, and CSS',
    //     text: 'Compatible with macOS, Windows, and Linux, Electron apps run on three platforms across all supported architectures.',
    //   })
    // );
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
