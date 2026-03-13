import { createOverlay } from '../../core/ui/overlay.js';
import { createButton } from '../../core/ui/buttons.js';
import { getAssets } from '../../core/assets.js';

export function init() {
    chrome.storage.local.get({ onboardingShown: false }, function(settings) {
        if (!settings.onboardingShown) {
            const bodyContent = document.createElement('div');
            const assets = getAssets();
            bodyContent.style.maxHeight = 'calc(90vh - 150px)';
            bodyContent.style.overflowY = 'auto';

            bodyContent.innerHTML = `
                <p style="line-height: 1.6; margin-bottom: 15px;">
                    Thank you for installing <strong>RoNet</strong>!
                </p>

                <p style="line-height: 1.6; margin-bottom: 15px;">
                    To change settings and explore all features, you can:
                </p>
                <ul style="list-style-type: disc; margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
                    <li>Click the <strong>gear icon</strong> in the Roblox header, and then click on "RoNet Setting".</li>
                   
                </ul>
            `;// Verified
            // <img src="${assets.onboarding}" alt="A guide showing where to find the RoNet settings button on the Roblox website." style="max-width: 100%; height: auto; display: block; margin: 5px auto 20px auto; border-radius: 8px; border: 1px solid var(--ronet-overlay-border-primary, #D9DADB);"/>

            const acknowledgeOnboarding = () => {
                chrome.storage.local.set({ onboardingShown: true }, function() {
                    console.log('RoNet: Onboarding acknowledged and marked as shown.');
                });
            };

            const gotItButton = createButton('Got It!', 'primary');

            const { close } = createOverlay({
                title: 'Welcome to RoNet!',
                bodyContent: bodyContent,
                actions: [gotItButton],
                maxWidth: 'min(550px, 90vw)',
                showLogo: true,
                preventBackdropClose: true,
                onClose: acknowledgeOnboarding
            });

            gotItButton.addEventListener('click', () => {
                close();
            });
        }
    });
}