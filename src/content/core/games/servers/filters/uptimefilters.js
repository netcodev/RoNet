// uptime filters

import { callRobloxApiJson } from '../../../api.js';
import { createDropdown } from '../../../ui/dropdown.js';
import { addTooltip } from '../../../ui/tooltip.js'; 

let isInitialized = false;
let currentDropdownInstance = null;
let currentCursor = null; 

const LABELS = {
    newest: 'Newest Servers',
    oldest: 'Oldest Servers'
};


function getPlaceIdFromUrl() {
    try {
        const match = window.location.href.match(/\/games\/(\d+)/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}


async function fetchUptimeServers(value, cursor = null) {
    const placeId = getPlaceIdFromUrl();
    if (!placeId) {
        console.error('RoNet UptimeFilters: Could not determine Place ID.');
        return null;
    }

    const limit = 10;
    let endpoint = value === 'oldest'
        ? `/v1/servers/oldest?place_id=${placeId}&limit=${limit}`
        : `/v1/servers/newest?place_id=${placeId}&limit=${limit}`;

    if (cursor) {
        endpoint += `&cursor=${encodeURIComponent(cursor)}`;
    }

    try {
        return await callRobloxApiJson({
            endpoint: endpoint,
            isRonetApi: true
        });
    } catch (error) {
        console.error(`RoNet UptimeFilters: Failed to fetch ${value} servers.`, error);
        return null;
    }
}


async function onFilterChange(value) {
    if (!value) return;

    currentCursor = null;

    if (currentDropdownInstance && LABELS[value]) {
        const trigger = currentDropdownInstance.element.querySelector('.ronet-dropdown-trigger .content-emphasis');
        if (trigger) trigger.textContent = LABELS[value];
    }

    document.dispatchEvent(new CustomEvent('ronetUptimeSelected'));

    if (!document.body.classList.contains('ronet-filter-active')) {
        document.body.classList.add('ronet-filter-active');
        const clearButton = document.getElementById('ronet-clear-filter-btn');
        if (clearButton) clearButton.style.display = 'flex';
    }

    const response = await fetchUptimeServers(value, null);
    const servers = response?.servers || [];
    currentCursor = response?.next_cursor || null;

    document.dispatchEvent(new CustomEvent('ronetRegionServersLoaded', {
        detail: {
            regionCode: value,
            servers: servers,
            next_cursor: currentCursor
        }
    }));
}


function createUptimeDropdown(container) {
    const dropdownItems = [
        { value: 'newest', label: 'Newest Servers' },
        { value: 'oldest', label: 'Oldest Servers' }
    ];

    const dropdown = createDropdown({
        items: dropdownItems,
        initialValue: null,
        onValueChange: onFilterChange,
        showFlags: false
    });

    dropdown.element.classList.add('ronet-uptime-dropdown-container', 'ronet-filter-widget');


    dropdown.element.style.minWidth = '160px';

    const trigger = dropdown.element.querySelector('.ronet-dropdown-trigger .content-emphasis');
    if (trigger) trigger.textContent = 'Server Uptime';


    const triggerBtn = dropdown.trigger || dropdown.element.querySelector('.ronet-dropdown-trigger');
    if (triggerBtn) {
        addTooltip(triggerBtn, 'Filter servers by uptime (newest/oldest)', { position: 'top' });
    }

    container.prepend(dropdown.element);
    currentDropdownInstance = dropdown;
}


export function initUptimeFilters() {
    if (isInitialized) return;
    isInitialized = true;

    document.addEventListener('ronetRequestRegionServers', async (ev) => {
        const { regionCode } = ev.detail || {};
        
        if (regionCode !== 'newest' && regionCode !== 'oldest') return;

        if (!currentCursor) {
            document.dispatchEvent(new CustomEvent('ronetRegionServersLoaded', {
                detail: { regionCode, servers: [], next_cursor: null, append: true }
            }));
            return;
        }

        const response = await fetchUptimeServers(regionCode, currentCursor);
        const servers = response?.servers || [];
        currentCursor = response?.next_cursor || null;

        document.dispatchEvent(new CustomEvent('ronetRegionServersLoaded', {
            detail: {
                regionCode: regionCode,
                servers: servers,
                next_cursor: currentCursor,
                append: true
            }
        }));
    });

    document.addEventListener('ronetRegionSelected', () => {
        if (currentDropdownInstance) {
            if (currentDropdownInstance.setValue) currentDropdownInstance.setValue(null, true);
            currentCursor = null; 
            const trigger = currentDropdownInstance.element.querySelector('.ronet-dropdown-trigger .content-emphasis');
            if (trigger) trigger.textContent = 'Server Uptime';
        }
    });

    document.addEventListener('ronetClearFilters', () => {
        if (currentDropdownInstance) {
            if (currentDropdownInstance.setValue) currentDropdownInstance.setValue(null, true);
            
            currentCursor = null; 

            const trigger = currentDropdownInstance.element.querySelector('.ronet-dropdown-trigger .content-emphasis');
            if (trigger) trigger.textContent = 'Server Uptime';
        }
    });

    const container = document.getElementById('ronet-main-controls');
    if (container && !container.querySelector('.ronet-uptime-dropdown-container')) {
        createUptimeDropdown(container);
    }
}