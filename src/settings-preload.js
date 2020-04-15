const { ipcRenderer: ipc, remote } = require('electron');
let browser = remote.getCurrentWindow()

function requestMonitors(fullRefresh = false) {
    if(fullRefresh) {
        ipc.send('full-refresh')
    } else {
        ipc.send('request-monitors')
    }
}

function requestAccent() {
    ipc.send('request-colors')
}

// Send brightness update request. Params are the monitor's index in the array and requested brightness level.
function updateBrightness(index, level) {
    ipc.send('update-brightness', {
        index,
        level
    })
}

//
// Send Settings
// - Send immediately if no recent changes. Throttle if frequent changes.
//
//

let sendSettingsThrottle = false
let sendSettingsObj = {}
function sendSettings(newSettings = {}) {
    sendSettingsObj = Object.assign(sendSettingsObj, newSettings)
    if(!sendSettingsThrottle) {
        actuallySendSettings()
        sendSettingsThrottle = setTimeout(() => {
            actuallySendSettings()
            sendSettingsThrottle = false
        }, 333)
    }
}

function actuallySendSettings() {
    ipc.send('send-settings', sendSettingsObj)
    sendSettingsObj = {}
}

function requestSettings() {
    ipc.send('request-settings')
}

function resetSettings() {
    ipc.send('reset-settings')
}

function openURL(url) {
    ipc.send('open-url', url)
}

function getUpdate(url) {
    ipc.send('get-update', url)
}

// Monitor info updated
ipc.on("monitors-updated", (e, monitors) => {
    if(JSON.stringify(window.allMonitors) == JSON.stringify(monitors)) return false;
    window.allMonitors = monitors
    window.lastUpdate = Date.now()
    window.dispatchEvent(new CustomEvent('monitorsUpdated', {
        detail: monitors
    }))
})

// Accent colors recieved
ipc.on('update-colors', (event, data) => {
    window.document.body.style.setProperty("--system-accent-color", data.accent)
    window.document.body.style.setProperty("--system-accent-lighter", data.lighter)
    window.document.body.style.setProperty("--system-accent-light", data.light)
    window.document.body.style.setProperty("--system-accent-medium", data.medium)
    window.document.body.style.setProperty("--system-accent-medium-dark", data.mediumDark)
    window.document.body.style.setProperty("--system-accent-transparent", data.transparent)
    window.document.body.style.setProperty("--system-accent-dark", data.dark)
    window.accent = data.accent
})

ipc.on('settings-updated', (event, settings) => {
    window.settings = settings
    window.dispatchEvent(new CustomEvent('settingsUpdated', {
        detail: settings
    }))
})

// Localization recieved
ipc.on('localization-updated', (event, localization) => {
    window.dispatchEvent(new CustomEvent('localizationUpdated', {
        detail: localization
    }))
})

// Request startup data
browser.webContents.once('dom-ready', () => {
    requestSettings()
    requestMonitors()
    requestAccent()
})

window.ipc = ipc
window.updateBrightness = updateBrightness
window.requestMonitors = requestMonitors
window.sendSettings = sendSettings
window.requestSettings = requestSettings
window.resetSettings = resetSettings
window.getUpdate = getUpdate
window.openURL = openURL
window.allMonitors = []
window.lastUpdate = Date.now()
window.showPanel = false
window.settings = {}
window.thisWindow = browser
window.accent = "cyan"

window.version = 'v' + remote.app.getVersion()
window.isAppX = (remote.app.name == "twinkle-tray-appx" ? true : false)