import { getAssets } from '../../assets.js';

let ronetButtonAdded = false;


export function addCustomButton(debouncedAddPopoverButton) {
    if (!window.location.href.includes('/my/account') || window.location.href.includes('?ronet=')) {
        return;
    }

    const menuList = document.querySelector('ul.menu-vertical[role="tablist"]');
    if (!menuList) {
        if (debouncedAddPopoverButton) debouncedAddPopoverButton();
        return;
    }

    let divider = menuList.querySelector('li.rbx-divider.thick-height');
    if (!divider) {
        const lastMenuItem = menuList.querySelector('li.menu-option[role="tab"]:last-of-type');
        if (!lastMenuItem) {
            if (debouncedAddPopoverButton) debouncedAddPopoverButton();
            return;
        }
        const newDivider = document.createElement('li');
        newDivider.classList.add('rbx-divider', 'thick-height');
        newDivider.style.width = '100%';
        newDivider.style.height = '2px';
        lastMenuItem.insertAdjacentElement('afterend', newDivider);
        divider = newDivider;
    } else {
        divider.style.width = '100%';
    }

    if (ronetButtonAdded) return;

    const existingButton = menuList.querySelector('li.menu-option > a > span.font-caption-header[textContent="RoNet Settings"]');
    if (existingButton) {
        ronetButtonAdded = true;
        return;
    }

    const assets = getAssets();
    const newButtonListItem = document.createElement('li');
    newButtonListItem.classList.add('menu-option');
    newButtonListItem.setAttribute('role', 'tab');

    const newButtonLink = document.createElement('a');
    newButtonLink.href = 'https://www.roblox.com/my/account?ronet=info';
    newButtonLink.classList.add('menu-option-content');
    newButtonLink.style.cursor = 'pointer';
    newButtonLink.style.display = 'flex';
    newButtonLink.style.alignItems = 'center';

    newButtonLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.location.search.includes('ronet=')) {
            window.location.reload();
        } else {
            window.location.href = 'https://www.roblox.com/my/account?ronet=info#!/info';
        }
    });

    const newButtonSpan = document.createElement('span');
    newButtonSpan.classList.add('font-caption-header');
    newButtonSpan.textContent = 'RoNet Settings';
    newButtonSpan.style.fontSize = '12px';

    const logo = document.createElement('img');
    logo.src = assets.ronetIcon;
    logo.style.width = '15px';
    logo.style.height = '15px';
    logo.style.marginRight = '5px';
    logo.style.verticalAlign = 'middle';

    newButtonLink.append(logo, newButtonSpan);
    newButtonListItem.appendChild(newButtonLink);
    divider.insertAdjacentElement('afterend', newButtonListItem);
    ronetButtonAdded = true;
}

// TODO add a setting to disable this
export function addPopoverButton() {
    if (window.ronetPopoverButtonAdded) return;

    const popoverMenu = document.getElementById('settings-popover-menu');
    if (!popoverMenu) return;

    if (popoverMenu.querySelector('a[href*="?ronet=info"]')) {
        window.ronetPopoverButtonAdded = true;
        return;
    }

    const assets = getAssets();
    const newButtonListItem = document.createElement('li');
    const newButtonLink = document.createElement('a');
    newButtonLink.className = 'rbx-menu-item';
    newButtonLink.href = 'https://www.roblox.com/my/account?ronet=info';
    Object.assign(newButtonLink.style, { display: 'flex', alignItems: 'center', gap: '8px' });

    newButtonLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.location.search.includes('ronet=')) {
            window.location.reload();
        } else {
            window.location.href = 'https://www.roblox.com/my/account?ronet=info';
        }
    });

    const logo = document.createElement('img');
    logo.src = assets.ronetIcon;
    Object.assign(logo.style, { width: '18px', height: '18px' });

    const buttonText = document.createTextNode('RoNet Settings');
    newButtonLink.append(logo, buttonText);
    newButtonListItem.appendChild(newButtonLink);

    const nativeSettingsLink = popoverMenu.querySelector('a.rbx-menu-item[href="/my/account"]');
    if (nativeSettingsLink?.parentElement) {
        nativeSettingsLink.parentElement.before(newButtonListItem);
    } else {
        popoverMenu.prepend(newButtonListItem);
    }

    window.ronetPopoverButtonAdded = true;
}