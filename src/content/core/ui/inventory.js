// Smartest not to use!!!
import DOMPurify from 'dompurify';
import { safeHtml } from '../../core/packages/dompurify.js'

export function createInventoryOverlay(options) {
    const { title, stat, rolimonsUrl, onSearch, onLoadMore } = options;


    let isLoading = false;

    const overlay = document.createElement('div'); 
    overlay.className = 'ronet-inventory-overlay';
    overlay.style.display = 'none'; 
    const rolimonsLink = rolimonsUrl
        ? `<a href="${rolimonsUrl}" target="_blank" rel="noopener noreferrer" class="ronet-rolimons-link">
             <div class="ronet-tooltip">Open in Rolimon's</div>
             <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3z"></path></svg>
           </a>`
        : '';
    overlay.innerHTML = safeHtml`
        <div class="ronet-inventory-content">
            <div class="ronet-inventory-header">
                <div class="ronet-inventory-header-main">
                    <h3>${title} <span class="total-rap">(${stat || ''})</span></h3>
                    ${rolimonsLink}
                </div>
                <div class="ronet-inventory-search-container">
                    <input type="text" class="ronet-inventory-search" placeholder="Search by item name...">
                </div>
                <button class="ronet-inventory-close">&times;</button>
            </div>
            <div class="ronet-inventory-list padding-large overflow-y-auto flex-grow"></div>
        </div>
    `;

    const itemListEl = overlay.querySelector('.ronet-inventory-list');
    const searchInput = overlay.querySelector('.ronet-inventory-search');

    const show = () => {
        document.body.appendChild(overlay);
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    const close = () => {
        overlay.remove();
        document.body.style.overflow = '';
    };

    overlay.querySelector('.ronet-inventory-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    if (onSearch) {
        searchInput.addEventListener('input', () => onSearch(searchInput.value));
    }

    if (onLoadMore) {
        itemListEl.addEventListener('scroll', () => {
            const isNearBottom = itemListEl.scrollTop + itemListEl.clientHeight >= itemListEl.scrollHeight - 250;
            if (isNearBottom && !isLoading) {
                onLoadMore();
            }
        });
    }

    const addItems = (items, thumbnailCache, itemConfig) => {
        const fragment = document.createDocumentFragment();
        items.forEach(item => {
            const card = createItemCard(item, thumbnailCache, itemConfig);
            fragment.appendChild(card);
        });
        itemListEl.appendChild(fragment);
        isLoading = false;
    };

    const clearItems = () => {
        itemListEl.innerHTML = '';
    };

    const setLoading = (message = 'Loading...') => {
        isLoading = true;
        const loadingEl = document.createElement('p');
        loadingEl.className = 'ronet-inventory-message';
        loadingEl.innerText = message;
        itemListEl.appendChild(loadingEl);
    };

    const setEmpty = (message = 'No items found.') => {
        clearItems();
        const emptyEl = document.createElement('p');
        emptyEl.className = 'ronet-inventory-message';
        emptyEl.innerText = message;
        itemListEl.appendChild(emptyEl);
    };

    return {
        show,
        close,
        addItems,
        clearItems,
        setLoading,
        setEmpty,
    };
}