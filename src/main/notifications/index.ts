// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shell, Notification, ipcMain} from 'electron';
import log from 'electron-log';

import {MentionData} from 'types/notification';

import {PLAY_SOUND} from 'common/communication';
import {TAB_MESSAGING} from 'common/tabs/TabView';

import WindowManager from '../windows/windowManager';

import {Mention} from './Mention';
import {DownloadNotification} from './Download';
import {NewVersionNotification, UpgradeNotification} from './Upgrade';

export const currentNotifications = new Map();

export function displayMention(title: string, body: string, channel: {id: string}, teamId: string, url: string, silent: boolean, webcontents: Electron.WebContents, data: MentionData, postUserId: string) {
    if (!Notification.isSupported()) {
        log.error('notification not supported');
        return;
    }
    const serverName = WindowManager.getServerNameByWebContentsId(webcontents.id);

    const options = {
        title: `${serverName}: ${title}`,
        body,
        silent,
        data,
    };

    const mention = new Mention(options, channel, teamId);
    const mentionKey = `${mention.teamId}:${mention.channel.id}`;

    mention.on('show', () => {
        // On Windows, manually dismiss notifications from the same channel and only show the latest one
        if (process.platform === 'win32') {
            if (currentNotifications.has(mentionKey)) {
                log.info(`close ${mentionKey}`);
                currentNotifications.get(mentionKey).close();
                currentNotifications.delete(mentionKey);
            }
            currentNotifications.set(mentionKey, mention);
        }
        const notificationSound = mention.getNotificationSound();
        if (notificationSound) {
            WindowManager.sendToRenderer(PLAY_SOUND, notificationSound);
        }
        WindowManager.flashFrame(true);

        // 2022-02-21. xofl - add noti function
        const mainWindow = WindowManager.getMainWindow();
        if (mainWindow) {
            log.info('postUserId', postUserId);

            const notiData = {content: mention.body, postUserId};
            const windowContent = mention.body;
            const notiCheck = handleValidateNotiType(windowContent);
            if (notiCheck) {
                const notiWindow = WindowManager.makeNotiWindow();

                notiWindow.once('show', () => {
                    notiWindow.webContents.send('notiData', notiData);
                    webcontents.send('notification-clicked', {channel, teamId, url});
                });

                ipcMain.on('closeAlert', () => WindowManager.close());
            }
        }
    });

    mention.on('click', () => {
        log.info('notification click', serverName, mention);
        if (serverName) {
            WindowManager.switchTab(serverName, TAB_MESSAGING);
            webcontents.send('notification-clicked', {channel, teamId, url});
        }
    });
    mention.show();
}

export function displayDownloadCompleted(fileName: string, path: string, serverName: string) {
    if (!Notification.isSupported()) {
        log.error('notification not supported');
        return;
    }
    const download = new DownloadNotification(fileName, serverName);

    download.on('show', () => {
        WindowManager.flashFrame(true);
    });

    download.on('click', () => {
        shell.showItemInFolder(path.normalize());
    });
    download.show();
}

let upgrade: NewVersionNotification;

export function displayUpgrade(version: string, handleUpgrade: () => void): void {
    if (upgrade) {
        upgrade.close();
    }
    upgrade = new NewVersionNotification();
    upgrade.on('click', () => {
        log.info(`User clicked to upgrade to ${version}`);
        handleUpgrade();
    });
    upgrade.show();
}

let restartToUpgrade;
export function displayRestartToUpgrade(version: string, handleUpgrade: () => void): void {
    restartToUpgrade = new UpgradeNotification();
    restartToUpgrade.on('click', () => {
        log.info(`User requested perform the upgrade now to ${version}`);
        handleUpgrade();
    });
    restartToUpgrade.show();
}

// 2022-02-21. xofl - add noti function (check noti)
const handleValidateNotiType = (windowContent: string) => {
    const title = windowContent.split(':');
    const callType = title[1].trim().substring(0, 3);

    return callType === '!호출';
};
