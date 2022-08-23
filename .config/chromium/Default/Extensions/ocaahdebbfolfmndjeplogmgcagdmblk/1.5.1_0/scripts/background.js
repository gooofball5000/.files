importScripts("./util.js");
const nonWebstoreExtensionsDownloading = new Set();
const manualInstallExtensionsDownloading = new Set();
const tabsAwaitingInstall = new Set();
const extensionsTabId = {};
function handleContextClick(info, tab) {
    if (info.menuItemId == "updateAll")
        checkForUpdates(function (
            updateCheck,
            installed_versions,
            appid,
            updatever,
            is_webstore
        ) {
            let crx_url = updateCheck["@codebase"];
            promptInstall(crx_url, is_webstore);
        });
    else if (info.menuItemId == "installExt")
        chrome.tabs.sendMessage(tab.id, {
            action: "install",
        });
    else if (info.menuItemId == "cws")
        chrome.tabs.create({
            url: "https://chrome.google.com/webstore/",
        });
}

function updateBadge(modified_ext_id = null) {
    checkForUpdates();
}

function startupTasks() {
    chrome.storage.sync.get(DEFAULT_MANAGEMENT_OPTIONS, function (settings) {
        chrome.storage.local.get(
            {
                badge_display: "",
                last_scheduled_update: 0,
            },
            (localstore) => {
                chrome.action.setBadgeText({
                    text: localstore.badge_display,
                });
                chrome.alarms.create("cws_check_extension_updates", {
                    delayInMinutes: Math.max(
                        1,
                        settings.update_period_in_minutes -
                            Math.floor(
                                (Date.now() -
                                    localstore.last_scheduled_update) /
                                    1000 /
                                    60
                            )
                    ),
                    periodInMinutes: settings.update_period_in_minutes,
                });
            }
        );
    });
}
chrome.action.setBadgeBackgroundColor({
    color: "#F00",
});
chrome.management.onInstalled.addListener(function (ext) {
    updateBadge(ext.id);
    for (let tabid of tabsAwaitingInstall) {
        chrome.tabs.sendMessage(
            tabid,
            {
                action: "extInstalled",
                extId: ext.id,
            },
            () => {
                if (chrome.runtime.lastError) tabsAwaitingInstall.delete(tabid);
            }
        );
    }
});
chrome.management.onUninstalled.addListener(function (ext) {
    updateBadge(ext.id);
});
chrome.runtime.onStartup.addListener(function () {
    startupTasks();
});
chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name == "cws_check_extension_updates")
        chrome.storage.sync.get(
            DEFAULT_MANAGEMENT_OPTIONS,
            function (settings) {
                if (settings.auto_update) {
                    updateBadge();
                    chrome.storage.local.set({
                        last_scheduled_update: Date.now(),
                    });
                    chrome.alarms.create("cws_check_extension_updates", {
                        delayInMinutes: settings.update_period_in_minutes,
                        periodInMinutes: settings.update_period_in_minutes,
                    });
                }
            }
        );
});
chrome.runtime.onInstalled.addListener(function () {
    startupTasks();
    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("contextMenu_updateAll"),
        id: "updateAll",
        contexts: ["action"],
    });
    chrome.contextMenus.create({
        title: "🔗 Chrome Web Store",
        id: "cws",
        contexts: ["action"],
    });
    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("webstore_addButton"),
        id: "installExt",
        documentUrlPatterns: [
            "https://chrome.google.com/webstore/detail/*",
            "https://addons.opera.com/*/extensions/details/*",
            "https://microsoftedge.microsoft.com/addons/detail/*",
        ],
    });
});
const msgHandler = function (request, sender, sendResponse) {
    if (request.nonWebstoreDownloadUrl) {
        chrome.downloads.download(
            {
                url: request.nonWebstoreDownloadUrl,
            },
            (dlid) => {
                nonWebstoreExtensionsDownloading.add(dlid);
            }
        );
    }
    if (request.manualInstallDownloadUrl) {
        // chrome.downloads.download is currently bugged in manifest v3. see: https://bugs.chromium.org/p/chromium/issues/detail?id=1246717
        // if this is ever fixed, a large chunk of code can be removed/simplified.
        // chrome.downloads.download(
        //     {
        //         url: request.manualInstallDownloadUrl,
        //         saveAs: true, // required to suppress warning: "Apps, extensions and user scripts cannot be added from this website"
        //     },
        //     (dlid) => {
        //         manualInstallExtensionsDownloading.add(dlid);
        //     }
        // );
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            func: directDownloadCrx,
            args: [request.manualInstallDownloadUrl],
        });
    }
    if (request.newTabUrl) {
        chrome.tabs.create({ active: false }, (tab) => {
            chrome.tabs.update(tab.id, { url: request.newTabUrl });
        });
    }
    if (request.checkExtInstalledId) {
        chrome.management.get(request.checkExtInstalledId, (extinfo) => {
            sendResponse({
                installed: !(chrome.runtime.lastError && !extinfo),
            });
        });
        return true;
    }
    if (request.uninstallExt) {
        chrome.management.uninstall(request.uninstallExt, () => {
            sendResponse({ uninstalled: !chrome.runtime.lastError });
        });
        return true;
    }
    if (request.installExt) {
        tabsAwaitingInstall.add(sender.tab.id);
    }
};
chrome.runtime.onMessage.addListener(msgHandler);
chrome.downloads.onChanged.addListener((d) => {
    // open non-cws CRX files after downloading them, enables one-click install in ungoogled chromium.
    // in later versions ~v103+ of ungoogled chromium this is no longer needed as the install prompt will be displayed with the initial download.
    // however, the only downside is if you press "cancel" on the initial install prompt, the prompt will be displayed a second time.
    if (d.endTime && nonWebstoreExtensionsDownloading.has(d.id)) {
        nonWebstoreExtensionsDownloading.delete(d.id);
        chrome.storage.sync.get(
            DEFAULT_MANAGEMENT_OPTIONS,
            function (settings) {
                if (!settings.manually_install) {
                    chrome.downloads.search(
                        {
                            id: d.id,
                        },
                        (di) => {
                            chrome.tabs.create({
                                url: "file:///" + di[0].filename,
                            });
                        }
                    );
                }
            }
        );
    }
    if (d.endTime && manualInstallExtensionsDownloading.has(d.id)) {
        manualInstallExtensionsDownloading.delete(d.id);
        // open chrome://extensions tab for easy drag-and-drop
        chrome.tabs.get(extensionsTabId?.id ?? 0, (tab) => {
            if (!chrome.runtime.lastError)
                chrome.tabs.highlight({
                    tabs: tab.index,
                    windowId: tab.windowId,
                });
            else
                chrome.tabs.create(
                    {
                        url: "chrome://extensions/",
                    },
                    (tab) => {
                        extensionsTabId.id = tab.id;
                    }
                );
        });
        // chrome.notifications.create("manually_install", {
        //     type: "basic",
        //     iconUrl: "assets/icon/icon_128.png",
        //     title: chrome.i18n.getMessage(
        //         "notify_manuallyInstall_title"
        //     ),
        //     message: chrome.i18n.getMessage(
        //         "notify_manuallyInstall_message"
        //     ),
        // });
    }
});
chrome.contextMenus.onClicked.addListener(handleContextClick);
