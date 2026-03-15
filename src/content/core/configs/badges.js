

import { getAssets } from '../assets.js';
import { CREATOR_USER_ID, CONTRIBUTOR_USER_IDS } from './userIds.js';

const assets = getAssets();

export const BADGE_CONFIG = {
    creator: {
        type: 'header',
        userIds: [CREATOR_USER_ID],
        icon: assets.ronetIcon,
        tooltip: 'Creator of RoNet',
        confetti: assets.ronetIcon,
        style: {},
        alwaysShow: true
    },
    contributor: {
        type: 'header',
        userIds: CONTRIBUTOR_USER_IDS,
        icon: assets.ronetIcon,
        tooltip: 'RoNet Contributor',
        confetti: assets.ronetIcon,
        style: { filter: 'sepia(80%) saturate(300%) brightness(90%) hue-rotate(-20deg)' }
    },
    gilbert: {
        type: 'badge',
        userIds: [CREATOR_USER_ID],
        icon: assets.ronetIcon,
        name: 'Gilbert',
        tooltip: 'Creator of RoNet',
        confetti: assets.ronetIcon,
        alwaysShow: true
    },
    legacy_donator: {
        type: 'header',
        userIds: [],
        icon: assets.ronetIcon,
        tooltip: 'Legacy Donator. Earned by donating to RoNet before donator badges were a thing.',
        confetti: assets.ronetIcon,
        style: { filter: 'sepia(100%) saturate(600%) brightness(90%) hue-rotate(5deg)' }
    },
    donator_1: {
        type: 'header',
        userIds: [],
        icon: assets.ronetIcon,
        tooltip: 'Donated any amount of Robux to help Support RoNet\'s development.',
        url: 'https://www.roblox.com/games/store-section/0',
        style: { filter: 'sepia(1) saturate(1.8) hue-rotate(-35deg) brightness(0.8) contrast(1.2)' }
    },
    donator_2: {
        type: 'header',
        userIds: [],
        icon: assets.ronetIcon,
        tooltip: 'Donated 200 or more Robux to help Support RoNet\'s development.',
        url: 'https://www.roblox.com/games/store-section/0',
        style: { filter: 'grayscale(1) brightness(1.3) contrast(1.2)' }
    },
    donator_3: {
        type: 'header',
        userIds: [],
        icon: assets.ronetIcon,
        tooltip: 'Donated 500 or more Robux to help Support RoNet\'s development.',
        url: 'https://www.roblox.com/games/store-section/0',
        style: { filter: 'sepia(1) saturate(3) hue-rotate(5deg) brightness(1.1)' }
    }
};