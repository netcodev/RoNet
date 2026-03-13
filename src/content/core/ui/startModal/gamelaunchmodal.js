// Creates a launch modal made to look like robloxs launchmodal
import { createOverlay } from '../overlay.js';
import { createSpinner } from '../spinner.js';
import { getAssets } from '../../assets.js';
import DOMPurify from 'dompurify';

let activeInstance = null;
let keepOverlayOpen = false;

export function showLoadingOverlay(
    onCancel,
    customLogo = null,
    closeOnBackgroundClick = false,
) {
    keepOverlayOpen = false;

    if (activeInstance) {
        activeInstance.close();
        activeInstance = null;
    }

    const bodyWrapper = document.createElement('div');
    bodyWrapper.className =
        'ronet-modal-content ronet-gamelaunch-modal-body';

    const logoImg = document.createElement('img');

    if (customLogo) {
        logoImg.src = customLogo;
    } else {
        try {
            logoImg.src = getAssets().ronetIcon;
        } catch (e) {}
    }

    logoImg.className = 'ronet-gamelaunch-logo';
    bodyWrapper.appendChild(logoImg);

    const textElement = document.createElement('h2');
    textElement.className = 'text-heading-medium ronet-gamelaunch-text';
    textElement.innerHTML = 'Searching For Servers...';
    bodyWrapper.appendChild(textElement);

    const infoContainer = document.createElement('div');
    infoContainer.className = 'ronet-gamelaunch-info-container';
    bodyWrapper.appendChild(infoContainer);

    const actionContainer = document.createElement('div');
    actionContainer.className = 'ronet-gamelaunch-action-container';
    const spinner = createSpinner({ size: '24px', color: '#FFFFFF' });
    actionContainer.appendChild(spinner);
    bodyWrapper.appendChild(actionContainer);

    const { overlay, close } = createOverlay({
        title: '',
        bodyContent: bodyWrapper,
        showLogo: false,
        maxWidth: '350px',
        preventBackdropClose: !closeOnBackgroundClick,
        onClose: () => {
            if (activeInstance) {
                activeInstance = null;
                if (typeof onCancel === 'function') onCancel();
            }
        },
    });

    const titleEl = overlay.querySelector(
        '.group-description-dialog-body-header',
    );
    if (titleEl) titleEl.remove();

    const closeBtn = overlay.querySelector(
        '.foundation-web-dialog-close-container button',
    );
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.onclick = () => {
            if (typeof onCancel === 'function') onCancel();
            hideLoadingOverlay(true);
        };
    }

    activeInstance = {
        overlay,
        close,
        textElement,
        actionContainer,
        infoContainer,
    };
}

export function hideLoadingOverlay(force = false) {
    if (keepOverlayOpen && !force) return;

    if (activeInstance) {
        const instance = activeInstance;
        activeInstance = null;
        instance.close();
    }
}

export function updateLoadingOverlayText(text) {
    if (activeInstance?.textElement)
        activeInstance.textElement.innerHTML = DOMPurify.sanitize(text);
}

export function updateServerInfo(gameName, iconUrl, detailsHtml) {
    if (!activeInstance?.infoContainer) return;
    const container = activeInstance.infoContainer;
    container.classList.remove('is-visible');
    container.innerHTML = '';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'ronet-game-header';

    const icon = document.createElement('img');
    icon.src = iconUrl || '';
    icon.className = 'ronet-gamelaunch-game-icon';

    const textDiv = document.createElement('div');
    textDiv.className = 'ronet-gamelaunch-text-container';

    const nameLabel = document.createElement('span');
    nameLabel.innerText = gameName || 'Roblox Experience';
    nameLabel.className = 'ronet-gamelaunch-game-name';

    textDiv.appendChild(nameLabel);
    headerDiv.appendChild(icon);
    headerDiv.appendChild(textDiv);
    container.appendChild(headerDiv);

    if (detailsHtml) {
        const detailsList = document.createElement('ul');
        detailsList.className = 'ronet-details-list';
        detailsList.innerHTML = DOMPurify.sanitize(detailsHtml);
        container.appendChild(detailsList);
    }

    container.classList.add('is-visible');

    requestAnimationFrame(() => {
        const wrappers = container.querySelectorAll('.ronet-channel-wrapper');

        wrappers.forEach((wrapper) => {
            const textElement = wrapper.querySelector(
                '.ronet-channel-truncated',
            );
            if (textElement) {
                if (textElement.scrollWidth > textElement.clientWidth) {
                    wrapper.classList.add('ronet-has-overflow');
                } else {
                    wrapper.classList.remove('ronet-has-overflow');
                }
            }
        });
    });
}
export function showLoadingOverlayResult(message, buttonOptions) {
    if (!activeInstance) return;
    keepOverlayOpen = true;
    updateLoadingOverlayText(message);
    const container = activeInstance.actionContainer;
    container.innerHTML = '';
    if (buttonOptions) {
        const btn = document.createElement('button');
        btn.textContent = buttonOptions.text;
        btn.className = 'ronet-gamelaunch-action-button';
        container.appendChild(btn);
        container.onclick = (e) => {
            e.stopPropagation();
            keepOverlayOpen = false;
            buttonOptions.onClick();
        };
    }
}
