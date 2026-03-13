// Creates roblox overlay
import { createCloseButton } from './closeButton.js';
import { createAssetIcon } from './general/toast.js';
import DOMPurify from 'dompurify';

export function createOverlay({
    title,
    bodyContent,
    actions = [],
    maxWidth = '550px',
    maxHeight = 'calc(100vh - 60px)',
    showLogo = false,
    preventBackdropClose = false,
    onClose,
    overflowVisible = false,
}) {
    const overlay = document.createElement('div');
    overlay.className = 'ronet-global-overlay';

    const content = document.createElement('div');
    content.className = 'ronet-overlay-content';
    content.setAttribute('role', 'dialog');
    content.style.maxWidth = maxWidth;
    content.style.maxHeight = maxHeight;
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    if (overflowVisible) {
        content.style.overflow = 'visible';
    } else {
        content.style.overflow = 'clip';
        content.style.overflowClipMargin = '30px';
    }

    const closeButtonContainer = document.createElement('div');
    closeButtonContainer.className = 'ronet-overlay-close';

    const body = document.createElement('div');
    body.className = 'ronet-overlay-body';
    body.style.flex = '1';
    if (overflowVisible) {
        body.style.overflowY = 'visible';
    } else {
        body.style.overflowY = 'auto';
    }
    body.style.minHeight = '0';

    const titleElement = document.createElement('div');
    titleElement.className = 'ronet-overlay-header';
    titleElement.style.display = 'flex';
    titleElement.style.alignItems = 'center';
    titleElement.style.flexShrink = '0';

    if (showLogo) {
        const assetName =
            typeof showLogo === 'string' ? showLogo : 'ronetIcon';
        const altText = assetName === 'ronetIcon' ? 'RoNet Logo' : 'Icon';

        const logo = createAssetIcon({
            assetName,
            altText,
            width: '24px',
            height: '24px',
        });

        if (logo) {
            logo.style.marginRight = '8px';
            logo.style.flexShrink = '0';
            titleElement.prepend(logo);
        }
    }

    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;
    titleSpan.style.wordBreak = 'break-word';
    titleSpan.style.minWidth = '0';
    titleElement.appendChild(titleSpan);
    content.appendChild(titleElement);

    if (typeof bodyContent === 'string') {
        const bodyContentContainer = document.createElement('div');
        bodyContentContainer.innerHTML = DOMPurify.sanitize(bodyContent);
        body.appendChild(bodyContentContainer);
    } else if (bodyContent instanceof HTMLElement) {
        body.appendChild(bodyContent);
    }

    content.appendChild(body);

    if (actions.length > 0) {
        const footer = document.createElement('div');
        footer.className = 'ronet-overlay-footer';
        footer.style.flexShrink = '0';
        actions.forEach((button) => footer.appendChild(button));
        content.appendChild(footer);
    }

    overlay.appendChild(content);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const close = () => {
        overlay.remove();
        document.body.style.overflow = '';
        if (typeof onClose === 'function') {
            onClose();
        }
    };

    const closeButton = createCloseButton({ onClick: close });
    closeButtonContainer.appendChild(closeButton);
    content.appendChild(closeButtonContainer);

    if (!preventBackdropClose) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    }

    return { overlay, close };
}
