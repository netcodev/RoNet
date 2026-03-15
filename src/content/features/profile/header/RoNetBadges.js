import { observeElement } from '../../../core/observer.js';
import { addTooltip } from '../../../core/ui/tooltip.js';
import { BADGE_CONFIG } from '../../../core/configs/badges.js';
import { callRobloxApiJson } from '../../../core/api.js';
import { createSquareButton } from '../../../core/ui/profile/header/squarebutton.js';
import { getUserIdFromUrl } from '../../../core/idExtractor.js';

function createHeaderBadge(parentContainer, badge) {
    const iconContainer = document.createElement('div');
    iconContainer.className = 'ronet-header-badge';
    Object.assign(iconContainer.style, {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: '8px',
        verticalAlign: 'middle'
    });

    const icon = document.createElement('img');
    icon.src = badge.icon;
    Object.assign(icon.style, {
        width: 'var(--icon-size-large)',
        height: 'var(--icon-size-large)', // Just to make it more consistent with Roblox
        cursor: 'pointer',
        ...badge.style
    });

    if (badge.url) {
        icon.addEventListener('click', () => {
            window.location.href = badge.url;
        });
    }

    if (badge.tooltip) {
        addTooltip(iconContainer, badge.tooltip, { position: 'bottom' });
    }

    parentContainer.appendChild(iconContainer);
    iconContainer.appendChild(icon);
}

function createTextHeaderBadge(parentContainer, badgeName, isHiddenInitially = false) {
    const badgeElement = document.createElement('span');
    badgeElement.textContent = badgeName.replace(/_/g, ' ');
    badgeElement.className = 'ronet-text-badge';

    const isHidden = isHiddenInitially;

    const applyVisualState = () => {
        if (isHidden) {
            Object.assign(badgeElement.style, {
                backgroundColor: 'var(--surface-neutral-tertiary)',
                color: 'var(--text-muted)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                marginLeft: '8px',
                verticalAlign: 'middle',
                cursor: 'default',
                textTransform: 'capitalize',
                opacity: '0.6',
                border: '1px dashed var(--text-muted)',
            });
            addTooltip(badgeElement, `This badge is hidden. Manage in settings.`, { position: 'bottom' });
        } else {
            Object.assign(badgeElement.style, {
                backgroundColor: 'var(--surface-neutral-tertiary)',
                color: 'var(--text-default)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                marginLeft: '8px',
                verticalAlign: 'middle',
                cursor: 'default',
                textTransform: 'capitalize',
                opacity: '1',
                border: 'none',
            });
        }
    };

    applyVisualState();
    parentContainer.appendChild(badgeElement);
}



function createRain(imageUrl) {
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 100000;
        overflow: hidden;
    `;
    document.body.appendChild(container);

    const interval = setInterval(() => {
        const drop = document.createElement('img');
        drop.src = imageUrl;
        const size = Math.random() * 500 + 50;
        const startLeft = Math.random() * 100;
        const duration = Math.random() * 2 + 2;

        drop.style.cssText = `
            position: absolute;
            top: -100px;
            left: ${startLeft}vw;
            width: ${size}px;
            height: auto;
            transition: top ${duration}s linear, transform ${duration}s linear;
        `;

        container.appendChild(drop);

        void drop.offsetWidth;

        drop.style.top = '110vh';
        drop.style.transform = `rotate(${Math.random() * 360}deg)`;

        setTimeout(() => {
            drop.remove();
        }, duration * 1000);
    }, 50);

    setTimeout(() => {
        clearInterval(interval);
        setTimeout(() => {
            container.remove();
        }, 5000);
    }, 10000);
}


async function addHeaderBadges(nameContainer) {
    if (nameContainer.dataset.ronetHeaderObserverAttached) return;
    nameContainer.dataset.ronetHeaderObserverAttached = 'true';

    const parentContainer = nameContainer.parentElement;
    if (!parentContainer) return;

    const uniqueId = `ronet-badges-${Date.now()}-${Math.random()}`;
    nameContainer.dataset.ronetId = uniqueId;

    const reapplyBadges = async () => {
        parentContainer.querySelectorAll('.ronet-header-badge, .ronet-text-badge').forEach((badge) => badge.remove());

        const currentUserId = getUserIdFromUrl();
        if (!currentUserId) return;

        for (const key in BADGE_CONFIG) {
            const badge = BADGE_CONFIG[key];
            if (badge.type === 'header' && badge.userIds.includes(currentUserId)) {
                createHeaderBadge(nameContainer, badge);
            }
        }

        try {
            const apiBadgesData = await callRobloxApiJson({
                isRonetApi: true,
                subdomain: 'apis',
                endpoint: `/v1/users/${currentUserId}/badges`,
                method: 'GET',
            });

            if (apiBadgesData && apiBadgesData.status === 'success' && Array.isArray(apiBadgesData.badges)) {
                apiBadgesData.badges.forEach((badgeName) => {
                    if (BADGE_CONFIG[badgeName]) {
                        createHeaderBadge(nameContainer, BADGE_CONFIG[badgeName]);
                    } else {
                        createTextHeaderBadge(nameContainer, badgeName, false);
                    }
                });
            }
        } catch (error) {
        }
    };

    await reapplyBadges();

    observeElement(`[data-ronet-id="${uniqueId}"] .ronet-header-badge, [data-ronet-id="${uniqueId}"] .ronet-text-badge`, () => {}, {
        onRemove: () => {
            if (!nameContainer.querySelector('.ronet-header-badge') && !nameContainer.querySelector('.ronet-text-badge')) reapplyBadges();
        },
    });
}


async function addProfileBadgeButtons(buttonContainer) {
    if (buttonContainer.dataset.ronetProfileBadgesProcessed) return;
    buttonContainer.dataset.ronetProfileBadgesProcessed = 'true';

    const currentUserId = getUserIdFromUrl();
    if (!currentUserId) return;

    const settings = await new Promise(resolve => chrome.storage.local.get({ ShowBadgesEverywhere: false }, resolve));

    for (const key in BADGE_CONFIG) {
        const badge = BADGE_CONFIG[key];
        if (badge.type === 'badge' && (badge.alwaysShow || settings.ShowBadgesEverywhere || badge.userIds.includes(currentUserId))) {
            if (badge.userIds.includes(currentUserId)) {
                const badgeButton = createSquareButton({
                    content: '🥚',
                    fontSize: '14px',
                    width: 'auto',
                    height: 'height-1000',
                    paddingX: 'padding-x-small',
                    disableTextTruncation: true,
                    onClick: (event) => {
                        createRain(badge.icon);
                    }
                });

                if (badge.tooltip) {
                    addTooltip(badgeButton, badge.tooltip);
                }

                badgeButton.style.marginRight = '5px';
                buttonContainer.prepend(badgeButton);
            }
        }
    }
}

export function init() {
    chrome.storage.local.get({ RoNetBadgesEnable: true }, (settings) => {
        if (settings.RoNetBadgesEnable) {
            observeElement('#profile-header-title-container-name', addHeaderBadges);
            observeElement('.profile-header-title-container', addHeaderBadges);
            observeElement('.flex.gap-small.buttons-show-on-desktop', addProfileBadgeButtons, { multiple: true });
        }
    });
}
