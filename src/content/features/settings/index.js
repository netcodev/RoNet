import { getAssets } from '../../core/assets.js';
import {
    getRegionData,
    loadDatacenterMap,
    getFullRegionName,
} from '../../core/regions.js';
import { observeElement } from '../../core/observer.js';
import { generateSingleSettingHTML } from '../../core/settings/generateSettings.js';
import { SETTINGS_CONFIG } from '../../core/settings/settingConfig.js';
import {
    exportSettings,
    importSettings,
    createExportImportButtons,
} from '../../core/settings/portSettings.js';
import {
    initSettings,
    initializeSettingsEventListeners,
    loadSettings,
    handleSaveSettings,
    updateConditionalSettingsVisibility,
    buildSettingsKey,
} from '../../core/settings/handlesettings.js';
import {
    addCustomButton,
    addPopoverButton,
} from '../../core/settings/ui/settingsbutton.js';
import { checkRoNetPage } from '../../core/settings/ui/page.js';
import { callRobloxApi } from '../../core/api.js';
import { safeHtml } from '../../core/packages/dompurify';
import DOMPurify from 'dompurify';
import { BADGE_CONFIG } from '../../core/configs/badges.js';

const assets = getAssets();
let REGIONS = {};

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function getLevenshteinDistance(a, b) {
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const matrix = Array.from({ length: b.length + 1 }, (_, j) =>
        Array.from({ length: a.length + 1 }, (_, i) =>
            j === 0 ? i : i === 0 ? j : 0,
        ),
    );

    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + indicator,
            );
        }
    }
    return matrix[b.length][a.length];
}

export async function applyTheme() {
    if (document.body.classList.contains('ronet-settings-loading')) {
        document.body.classList.remove('ronet-settings-loading');
    }
}

const debouncedApplyTheme = debounce(applyTheme, 50);
const debouncedAddPopoverButton = debounce(addPopoverButton, 100);
const debouncedAddCustomButton = debounce(
    () => addCustomButton(debouncedAddPopoverButton),
    100,
);

function getBadgeStyle(key) {
    const badge = BADGE_CONFIG[key];
    if (!badge || !badge.style) return '';
    return Object.entries(badge.style).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`).join(';');
}

const donatorBadgeKeys = ['donator_1', 'donator_2', 'donator_3'];
const donatorBadgesHtml = donatorBadgeKeys.map(key => {
    const badge = BADGE_CONFIG[key];
    if (!badge) return '';
    const styleString = getBadgeStyle(key);
    const shortTooltip = badge.tooltip.split('.')[0];

    return `
        <div title="${badge.tooltip}" style="display: flex; align-items: center; gap: 10px; padding: 10px; background-color: var(--ronet-container-background-color, rgba(0,0,0,0.1)); border-radius: 8px; flex: 1; min-width: 240px;">
            <img src="${badge.icon}" style="width: 32px; height: 32px; ${styleString}" />
            <span style="color: var(--ronet-main-text-color); font-size: 14px;">${shortTooltip}</span>
        </div>
    `;
}).join('');

export const buttonData = [
    {
        text: 'Info',
        content: `
            <div style="padding: 8px;">
                <h2 style="margin-bottom: 10px; color: var(--ronet-main-text-color) !important;">RoNet Information</h2>
                <p></p>
                <div style="margin-top: 5px;">
                    <p></p>
                    <div style="margin-top: 5px;">
                        <p></p>
                        <div style="margin-top: 5px;">
                            <p></p>
                            <div style="margin-top: 5px;">
                                <p></p>
                                <div style="margin-top: 5px;">
                                    <p></p>
                                    <div style="margin-top: 5px;">
                                        <p></p>
                                        <div style="margin-top: 5px;">
                                            <p></p>
                                        </div>
                                        <div style="margin-top: 10px; margin-bottom: 20px;">
                                            <a href="https://github.com/netcodev/RoNet" target="_blank" class="ronet-github-link">Github Repo</a>
                                        </div>
                                        <div id="export-import-buttons-container" style="border-top: 1px solid var(--ronet-secondary-text-color); opacity: 0.8; padding-top: 15px; display: flex; justify-content: flex-start; gap: 10px;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`,
    },
    {
        text: 'Settings',
        content: `
            <div id="settings-content" style="padding: 0; background-color: transparent;">
                <div id="setting-section-buttons" style="display: flex; margin-bottom: 25px;"></div>
                <div id="setting-section-content" style="padding: 5px;"></div>
            </div>`,
    },
];

function handleGlobalDomChange(event) {
    if (document.getElementById('settings-popover-menu')) {
        addPopoverButton();
    } else if (window.ronetPopoverButtonAdded) {
        window.ronetPopoverButtonAdded = false;
    }

    debouncedAddCustomButton();
    debouncedAddPopoverButton();

    const mutationsList = event.detail?.mutationsList;
    if (!mutationsList) return;

    const shouldUpdateTheme = mutationsList.some(
        (mutation) =>
            mutation.type === 'childList' &&
            mutation.addedNodes.length > 0 &&
            Array.from(mutation.addedNodes).some(
                (node) =>
                    node.nodeType === Node.ELEMENT_NODE &&
                    (node.matches(
                        '[data-theme-dependent], .setting, .menu-option, #content-container',
                    ) ||
                        node.querySelector(
                            '[data-theme-dependent], .setting, .menu-option, #content-container',
                        )),
            ),
    );

    if (shouldUpdateTheme) {
        debouncedApplyTheme();
    }
}

export async function updateContent(buttonInfo, contentContainer) {
    if (
        typeof buttonInfo !== 'object' ||
        buttonInfo === null ||
        !buttonInfo.content
    )
        return;

    const lowerText = buttonInfo.text.toLowerCase();
    const sanitizeConfig = { ADD_URI_SCHEMES: ['chrome-extension'] };

    if (lowerText === 'info' || lowerText === 'credits' || lowerText === 'donator perks') {
        ((contentContainer.innerHTML = `
            <div id="settings-content" style="padding: 0; background-color: transparent !important;"> 
                <div id="setting-section-content" style="padding: 5px;"> 
                    <div id="info-credits-background-wrapper" class="setting" style="margin-bottom: 15px;">
                        ${buttonInfo.content}
                    </div> 
                </div> 
            </div>`), //verified
            sanitizeConfig);
    } else {
        contentContainer.innerHTML = safeHtml(
            buttonInfo.content,
            sanitizeConfig,
        ); //verified
    }

    if (lowerText === 'info') {
        const buttonContainer = contentContainer.querySelector(
            '#export-import-buttons-container',
        );
        if (buttonContainer) {
            buttonContainer.appendChild(createExportImportButtons());
        }
    }

    const ronetHeader = document.querySelector(
        '#react-user-account-base > h1',
    );
    if (ronetHeader) {
        ronetHeader.style.setProperty(
            'color',
            'var(--ronet-main-text-color)',
            'important',
        );
    }
}

export async function handleSearch(event) {
    const query =
        event.target && event.target.value
            ? event.target.value.toLowerCase().trim()
            : '';

    const contentContainer = document.querySelector('#content-container');
    if (!contentContainer) return;

    document
        .querySelectorAll('#unified-menu .menu-option-content')
        .forEach((el) => {
            el.classList.remove('active');
            el.removeAttribute('aria-current');
        });

    if (query.length < 2) {
        contentContainer.innerHTML = DOMPurify.sanitize(
            `<div id="settings-content" style="padding: 15px; text-align: center; color: var(--ronet-main-text-color);">Please enter at least 2 characters to search.</div>`,
        );
        await applyTheme();
        return;
    }

    const searchResults = [];
    const queryNoSpaces = query.replace(/\s+/g, '');

    for (const categoryName in SETTINGS_CONFIG) {
        const category = SETTINGS_CONFIG[categoryName];
        for (const [settingName, settingDef] of Object.entries(
            category.settings,
        )) {
            const label = (
                Array.isArray(settingDef.label)
                    ? settingDef.label.join(' ')
                    : settingDef.label || ''
            ).toLowerCase();
            const description = (
                Array.isArray(settingDef.description)
                    ? settingDef.description.join(' ')
                    : settingDef.description || ''
            ).toLowerCase();
            const fullText = `${label} ${description}`;

            let isMatch =
                fullText.includes(query) ||
                fullText.replace(/\s+/g, '').includes(queryNoSpaces);

            if (!isMatch) {
                const words = fullText.split(/\s+/);
                const threshold = query.length > 5 ? 2 : 1;
                isMatch = words.some(
                    (word) => getLevenshteinDistance(query, word) <= threshold,
                );
            }

            if (!isMatch && settingDef.childSettings) {
                for (const childDef of Object.values(
                    settingDef.childSettings,
                )) {
                    const childLabel = (
                        Array.isArray(childDef.label)
                            ? childDef.label.join(' ')
                            : childDef.label || ''
                    ).toLowerCase();
                    const childDesc = (
                        Array.isArray(childDef.description)
                            ? childDef.description.join(' ')
                            : childDef.description || ''
                    ).toLowerCase();
                    if (`${childLabel} ${childDesc}`.includes(query)) {
                        isMatch = true;
                        break;
                    }
                }
            }

            if (
                isMatch &&
                !searchResults.some((res) => res.name === settingName)
            ) {
                searchResults.push({
                    category: category.title,
                    name: settingName,
                    config: settingDef,
                });
            }
        }
    }

    if (searchResults.length === 0) {
        contentContainer.innerHTML = safeHtml`<div id="settings-content" style="padding: 15px; text-align: center; color: var(--ronet-main-text-color);">No settings found for "${query}".</div>`;
    } else {
        const groupedResults = searchResults.reduce((acc, setting) => {
            if (!acc[setting.category]) acc[setting.category] = [];
            acc[setting.category].push(setting);
            return acc;
        }, {});

        contentContainer.innerHTML = '';

        const resultsWrapper = document.createElement('div');
        resultsWrapper.id = 'setting-section-content';
        resultsWrapper.style.padding = '5px';

        for (const categoryTitle in groupedResults) {
            const header = document.createElement('h2');
            header.className = 'settings-category-header';
            header.style.cssText =
                'margin-left: 5px; margin-bottom: 10px; color: var(--ronet-main-text-color);'; // Verified
            header.textContent = categoryTitle;
            resultsWrapper.appendChild(header);

            for (const setting of groupedResults[categoryTitle]) {
                const settingElement = generateSingleSettingHTML(
                    setting.name,
                    setting.config,
                    REGIONS,
                );

                if (settingElement instanceof Node) {
                    resultsWrapper.appendChild(settingElement);
                } else {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = safeHtml(settingElement); // Verified
                    while (tempDiv.firstChild) {
                        resultsWrapper.appendChild(tempDiv.firstChild);
                    }
                }
            }
        }

        contentContainer.appendChild(resultsWrapper);
    }

    await initSettings(contentContainer);
    await applyTheme();
}

document.addEventListener('click', (event) => {
    const target = event.target;

    if (target.id === 'export-ronet-settings') return exportSettings();
    if (target.id === 'import-ronet-settings') return importSettings();
    if (target.matches('.tab-button, .setting-section-button')) return;

    if (target.matches('input[type="checkbox"]')) {
        const settingName = target.dataset.settingName;
        if (settingName) {
            handleSaveSettings(settingName, target.checked).then(() => {
                const settingsContent = document.querySelector(
                    '#setting-section-content',
                );
                if (settingsContent) {
                    loadSettings().then((currentSettings) =>
                        updateConditionalSettingsVisibility(
                            settingsContent,
                            currentSettings,
                        ),
                    );
                }
            });
        }
    } else if (target.matches('select')) {
        const settingName = target.dataset.settingName;
        if (settingName) {
            handleSaveSettings(settingName, target.value).then(() => {
                const settingsContent = document.querySelector(
                    '#setting-section-content',
                );
                if (settingsContent) {
                    loadSettings().then((currentSettings) =>
                        updateConditionalSettingsVisibility(
                            settingsContent,
                            currentSettings,
                        ),
                    );
                }
            });
        }
    }
});

function onPopoverRemoved() {
    window.ronetPopoverButtonAdded = false;
}

async function initializeExtension() {
    try {
        const data = await getRegionData();
        REGIONS = data.regions;
    } catch (e) {
        console.warn('Failed to load region data:', e);
    }

    await applyTheme();
    await buildSettingsKey();

    addCustomButton(debouncedAddPopoverButton);
    addPopoverButton();

    initializeSettingsEventListeners();

    document.addEventListener('roblox-dom-changed', handleGlobalDomChange);

    observeElement('#settings-popover-menu', addPopoverButton, {
        onRemove: onPopoverRemoved,
    });
    observeElement('ul.menu-vertical[role="tablist"]', () =>
        addCustomButton(debouncedAddPopoverButton),
    );

    await checkRoNetPage();
}

export function init() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeExtension);
    } else {
        initializeExtension();
    }
}

window.addEventListener('beforeunload', () => {
    document.removeEventListener('roblox-dom-changed', handleGlobalDomChange);
});

document.addEventListener('DOMContentLoaded', function () {
    const PreferredRegionEnabled = document.getElementById(
        'PreferredRegionEnabled',
    );
    const preferredRegionSelect = document.getElementById(
        'preferredRegionSelect',
    );
    const regionSettingDiv = document.getElementById(
        'setting-preferred-region',
    );

    function updateRegionSelectVisibility() {
        if (PreferredRegionEnabled && regionSettingDiv) {
            const isEnabled = PreferredRegionEnabled.checked;
            regionSettingDiv.style.display = isEnabled ? 'flex' : 'none';
            if (preferredRegionSelect)
                preferredRegionSelect.disabled = !isEnabled;
        }
    }

    if (PreferredRegionEnabled) {
        PreferredRegionEnabled.addEventListener('change', function () {
            updateRegionSelectVisibility();
            handleSaveSettings('PreferredRegionEnabled', this.checked);
        });
    }

    if (preferredRegionSelect) {
        preferredRegionSelect.addEventListener('change', function () {
            handleSaveSettings('robloxPreferredRegion', this.value);
        });

        if (preferredRegionSelect.options.length === 0) {
            Object.keys(REGIONS).forEach((regionCode) => {
                const option = document.createElement('option');
                option.value = regionCode;
                option.textContent = getFullRegionName(regionCode);
                preferredRegionSelect.appendChild(option);
            });
        }
    }
    updateRegionSelectVisibility();
});

function initializeHeartbeatSpoofer() {
    const originalFetch = window.fetch;
    let pulseInterval = null;
    let spoofingMode = 'off';

    const sendSpoofedHeartbeat = async () => {
        let locationInfoPayload;

        if (spoofingMode === 'studio') {
            locationInfoPayload = { studioLocationInfo: { placeId: 0 } };
        } else {
            return;
        }

        const spoofedPulseRequest = {
            clientSideTimestampEpochMs: Date.now(),
            locationInfo: locationInfoPayload,
            sessionInfo: { sessionId: crypto.randomUUID() },
        };

        try {
            await callRobloxApi({
                subdomain: 'apis',
                endpoint: '/user-heartbeats-api/pulse',
                method: 'POST',
                body: spoofedPulseRequest,
                headers: { 'RoNet-Internal': 'true' },
            });
            console.log(
                `RoNet: Spoofed heartbeat sent. Mode: ${spoofingMode}`,
            );
        } catch (error) {
            console.error('RoNet: Failed to send spoofed heartbeat.', error);
        }
    };

    const startSpoofingTimer = () => {
        if (pulseInterval) return;
        console.log(`RoNet: Starting spoofer timer (${spoofingMode}).`);
        pulseInterval = setInterval(async () => {
            if (spoofingMode === 'studio') {
                sendSpoofedHeartbeat();
            }
        }, 30000);
    };

    const stopSpoofingTimer = () => {
        if (pulseInterval) {
            console.log('RoNet: Stopping spoofer timer.');
            clearInterval(pulseInterval);
            pulseInterval = null;
        }
    };

    const updateSpoofingMode = (settings) => {
        chrome.runtime.sendMessage({
            action: 'updateOfflineRule',
            enabled: settings.spoofAsOffline,
        });
        chrome.runtime.sendMessage({
            action: 'updateEarlyAccessRule',
            enabled: settings.EarlyAccessProgram,
        });

        if (settings.spoofAsOffline) spoofingMode = 'offline';
        else if (settings.spoofAsStudio) spoofingMode = 'studio';
        else spoofingMode = 'off';

        if (spoofingMode === 'studio') startSpoofingTimer();
        else stopSpoofingTimer();
    };

    const relevantSettings = [
        'spoofAsStudio',
        'spoofAsOffline',
        'EarlyAccessProgram',
    ];
    chrome.storage.local.get(relevantSettings, updateSpoofingMode);

    chrome.storage.onChanged.addListener((changes) => {
        if (relevantSettings.some((setting) => changes[setting])) {
            chrome.storage.local.get(relevantSettings, (result) => {
                if (changes.LaunchDelay) {
                    const toggle = document.querySelector(
                        '#LaunchDelay-enabled',
                    );
                    if (toggle) {
                        toggle.checked = changes.LaunchDelay.newValue > 0;
                        updateConditionalSettingsVisibility(
                            document.body,
                            result,
                        );
                    }
                }
                updateSpoofingMode(result);
            });
        }
    });

    window.fetch = async function (...args) {
        const url = args[0] ? args[0].toString() : '';
        let isInternal = false;

        if (args.length > 1 && args[1] && args[1].headers) {
            const originalOptions = args[1];
            const newOptions = { ...originalOptions };

            let hasHeader = false;

            if (newOptions.headers instanceof Headers) {
                if (newOptions.headers.get('RoNet-Internal') === 'true') {
                    hasHeader = true;
                    newOptions.headers = new Headers(newOptions.headers);
                    newOptions.headers.delete('RoNet-Internal');
                }
            } else if (
                typeof newOptions.headers === 'object' &&
                !Array.isArray(newOptions.headers)
            ) {
                if (newOptions.headers['RoNet-Internal'] === 'true') {
                    hasHeader = true;
                    newOptions.headers = { ...newOptions.headers };
                    delete newOptions.headers['RoNet-Internal'];
                }
            }

            if (hasHeader) {
                isInternal = true;
                args[1] = newOptions;
            }
        }

        if (
            url.includes('apis.roblox.com/user-heartbeats-api/pulse') &&
            spoofingMode !== 'off' &&
            !isInternal
        ) {
            return new Response(null, { status: 200, statusText: 'OK' });
        }

        return originalFetch.apply(this, args);
    };

    console.log('RoNet: Proactive heartbeat spoofer initialized.');
}

function manageSingletonExecution() {
    const KEYS = {
        ID: 'ronet_singleton_leader_id',
        SEEN: 'ronet_singleton_last_seen',
    };
    const INTERVAL = 5000;
    const LEASE = 10000;

    const instanceId = crypto.randomUUID();
    let isLeader = false;
    let timerId = null;
    let featuresInitialized = false;
    let destroyed = false;

    const toggleFeatures = (shouldRun) => {
        if (shouldRun && !featuresInitialized) {
            console.log(
                'RoNet: Leader instance. Initializing singleton features.',
            );
            initializeHeartbeatSpoofer();
            featuresInitialized = true;
        } else if (!shouldRun && featuresInitialized) {
            featuresInitialized = false;
            console.log('RoNet: No longer leader.');
        }
    };

    const resetLoop = (nextFn) => {
        if (timerId) clearInterval(timerId);

        if (destroyed) {
            timerId = null;
            return;
        }

        timerId = setInterval(nextFn, INTERVAL);
    };

    const handleContextInvalidated = (error) => {
        if (!error) return false;

        if (error.message?.includes('Extension context invalidated')) {
            destroyed = true;
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
            }
            return true;
        }

        console.warn('RoNet singleton error:', error);
        return false;
    };

    const attemptToBecomeLeader = () => {
        if (destroyed) return;

        isLeader = true;
        const info = { [KEYS.ID]: instanceId, [KEYS.SEEN]: Date.now() };

        try {
            chrome.storage.local.set(info, () => {
                try {
                    if (destroyed) return;

                    if (chrome.runtime?.lastError) {
                        if (chrome.runtime.lastError.message?.includes('Extension context invalidated')) {
                            destroyed = true;
                            clearInterval(timerId);
                            timerId = null;
                        }
                        return;
                    }

                    toggleFeatures(true);
                    resetLoop(renewLease);
                } catch (error) {
                    if (handleContextInvalidated(error)) {
                        return;
                    }
                    return;
                }
            });
        } catch (error) {
            if (handleContextInvalidated(error)) {
                return;
            }
            return;
        }
    };

    const renewLease = () => {
        if (destroyed || !isLeader) return;

        if (
            typeof chrome === 'undefined' ||
            !chrome.storage ||
            !chrome.storage.local
        ) {
            isLeader = false;
            toggleFeatures(false);
            resetLoop(checkForLeader);
            return;
        }

        try {
            chrome.storage.local.get(KEYS.ID, (result) => {
                if (destroyed) return;

                if (chrome.runtime?.lastError) {
                    if (chrome.runtime.lastError.message?.includes('Extension context invalidated')) {
                        destroyed = true;
                        clearInterval(timerId);
                        timerId = null;
                        return;
                    }
                    return;
                }

                if (result[KEYS.ID] !== instanceId) {
                    isLeader = false;
                    toggleFeatures(false);
                    resetLoop(checkForLeader);
                } else {
                    try {
                        chrome.storage.local.set({ [KEYS.SEEN]: Date.now() }, () => {
                            try {
                                if (destroyed) return;

                                if (chrome.runtime?.lastError) {
                                    if (chrome.runtime.lastError.message?.includes('Extension context invalidated')) {
                                        destroyed = true;
                                        clearInterval(timerId);
                                        timerId = null;
                                    }
                                    return;
                                }
                            } catch (error) {
                                if (handleContextInvalidated(error)) {
                                    return;
                                }
                                return;
                            }
                        });
                    } catch (error) {
                        if (handleContextInvalidated(error)) {
                            return;
                        }
                        return;
                    }
                }
            });
        } catch (error) {
            if (handleContextInvalidated(error)) {
                return;
            }
            return;
        }
    };

    const checkForLeader = () => {
        if (destroyed) return;

        try {
            chrome.storage.local.get([KEYS.ID, KEYS.SEEN], (result) => {
                try {
                    if (destroyed) return;

                    if (chrome.runtime?.lastError) {
                        // context invalidated can manifest here; stop running
                        if (chrome.runtime.lastError.message?.includes('Extension context invalidated')) {
                            destroyed = true;
                            clearInterval(timerId);
                            timerId = null;
                            return;
                        }
                        return;
                    }

                    const lastSeen = result[KEYS.SEEN];
                    const isLeaseActive = lastSeen && Date.now() - lastSeen < LEASE;

                    if (!result[KEYS.ID] || !isLeaseActive) {
                        attemptToBecomeLeader();
                    }
                } catch (error) {
                    if (handleContextInvalidated(error)) {
                        return;
                    }
                    return;
                }
            });
        } catch (error) {
            if (handleContextInvalidated(error)) {
                return;
            }
            return;
        }
    };

    window.addEventListener('beforeunload', () => {
        destroyed = true;
        if (timerId) {
            clearInterval(timerId);
            timerId = null;
        }

        if (isLeader && chrome.storage && chrome.storage.local) {
            chrome.storage.local.remove([KEYS.ID, KEYS.SEEN]);
        }
    });

    checkForLeader();
    resetLoop(checkForLeader);
}

manageSingletonExecution();
loadDatacenterMap();
