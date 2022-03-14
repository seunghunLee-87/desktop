import {contextBridge, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld(
    'api', {
        receive: (channel, func) => {
            const validChannels = ['notiData'];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },

        send: (channel, data) => {
            const validChannels = ['closeAlert'];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
    },
);
