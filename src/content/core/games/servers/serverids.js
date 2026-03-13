// adds the server ids to the server elements so we know what is what
import { observeElement } from '../../observer.js';

let extractorScriptInjected = false;

function injectExtractorScript() {
    if (extractorScriptInjected) return;
    
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('public/Assets/data/serverid_extractor.js');
    (document.head || document.documentElement).appendChild(script);
    extractorScriptInjected = true;
}


async function extractServerIdFromFiber(server) {
    if (!server) return null;
    
    injectExtractorScript();
    
    return new Promise((resolve) => {
        const extractionId = `ronet_extract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        server.setAttribute('data-ronet-extraction-id', extractionId);
        
        const listener = (event) => {
            if (event.detail && event.detail.extractionId === extractionId) {
                window.removeEventListener('ronet-serverid-extracted', listener);
                server.removeAttribute('data-ronet-extraction-id');
                resolve(event.detail.serverId || null);
            }
        };
        window.addEventListener('ronet-serverid-extracted', listener);
        
        window.dispatchEvent(new CustomEvent('ronet-extract-serverid-request', {
            detail: { extractionId }
        }));
        
        setTimeout(() => {
            window.removeEventListener('ronet-serverid-extracted', listener);
            server.removeAttribute('data-ronet-extraction-id');
            resolve(null);
        }, 1000);
    });
}


async function processServerElement(serverItem, retries = 5) {
    try {
        const serverId = await extractServerIdFromFiber(serverItem);
        
        if (serverId && serverId.length > 0) {
            const oldServerId = serverItem.getAttribute('data-ronet-serverid');
            
            if (oldServerId !== serverId) {
                serverItem.setAttribute('data-ronet-serverid', serverId);
                
                const event = new CustomEvent('ronet-serverid-set', { 
                    detail: { serverId },
                    bubbles: true 
                });
                serverItem.dispatchEvent(event);
            }
        } else if (serverItem.classList.contains('rbx-private-game-server-item') && !serverItem.hasAttribute('data-private-server-id') && retries > 0) {
            setTimeout(() => processServerElement(serverItem, retries - 1), 1000);
            return;
        }
        
        serverItem.classList.add('ronet-checked');
    } catch (e) {
        console.error('[RoNet ServerIDs] Error processing server:', e);
    }
}


function watchServerElement(serverItem) {
    const observer = new MutationObserver((mutations) => {
        const hasPlayerChange = mutations.some(mutation => {
            if (mutation.type === 'childList') {
                const target = mutation.target;
                if (target.classList?.contains('player-thumbnails-container') ||
                    target.closest('.player-thumbnails-container')) {
                    return true;
                }
            }
            return false;
        });
        
        if (hasPlayerChange) {
            
            serverItem.classList.remove('ronet-checked');
            
            processServerElement(serverItem);
        }
    });
    
    observer.observe(serverItem, {
        childList: true,
        subtree: true
    });
    
    serverItem._ronetServerObserver = observer;
}


export function initServerIdExtraction() {
    injectExtractorScript();
    
    const selectors = [
        '.rbx-public-game-server-item',
        '.rbx-friends-game-server-item', 
        '.rbx-private-game-server-item'
    ];
    
    selectors.forEach(selector => {
        observeElement(selector, (serverElement) => {
            processServerElement(serverElement);
            
            watchServerElement(serverElement);
        }, { multiple: true });
    });
}