const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('browser', {
  navigate:        (url)  => ipcRenderer.send('navigate', url),
  goBack:          ()     => ipcRenderer.send('go-back'),
  goForward:       ()     => ipcRenderer.send('go-forward'),
  reload:          ()     => ipcRenderer.send('reload'),
  windowMinimize:  ()     => ipcRenderer.send('window-minimize'),
  windowMaximize:  ()     => ipcRenderer.send('window-maximize'),
  windowClose:     ()     => ipcRenderer.send('window-close'),

  onLoading:       (cb)   => ipcRenderer.on('nav-loading',    (e, url)  => cb(url)),
  onLoaded:        (cb)   => ipcRenderer.on('nav-loaded',     (e, data) => cb(data)),
  onError:         (cb)   => ipcRenderer.on('nav-error',      (e, data) => cb(data)),
  onTitleUpdated:  (cb)   => ipcRenderer.on('title-updated',  (e, t)    => cb(t)),
});
