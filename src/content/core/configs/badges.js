

import { getAssets } from '../assets.js';
import { CREATOR_USER_ID, CONTRIBUTOR_USER_IDS, RAT_BADGE_USER_ID, BLAHAJ_BADGE_USER_ID, CAM_BADGE_USER_ID, alice_badge_user_id } from './userIds.js';

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
    rat: {
        type: 'badge',
        userIds: [RAT_BADGE_USER_ID],
        icon: assets.ratBadgeIcon,
        name: 'I make rats',
        tooltip: 'I make rats',
        confetti: assets.fishConfetti
    },
    blahaj: {
        type: 'badge',
        userIds: [BLAHAJ_BADGE_USER_ID],
        icon: assets.blahaj,
        name: 'BLAHAJ :3',
        tooltip: 'BLAHAJ :3',
        confetti: assets.blahaj
    },
    cam: {
        type: 'header',
        userIds: [CAM_BADGE_USER_ID],
        icon: assets.cam,
        name: 'kat >w<',
        tooltip: 'kat >w<',
        confetti: assets.cam
    },
    camEasterEgg: {
        type: 'badge',
        userIds: [CAM_BADGE_USER_ID],
        icon: assets.cam,
        name: 'kat >w<',
        tooltip: 'kat >w<',
        confetti: assets.cam
    },
    alice: {
        type: 'header',
        userIds: [alice_badge_user_id],
        icon: assets.alice,
        name: 'silly goober',
        tooltip: 'silly goober',
        confetti: assets.alice
    },
     aliceegg: {
        type: 'badge',
        userIds: [alice_badge_user_id],
        icon: assets.alice,
        name: 'silly goober',
        tooltip: 'silly goober',
        confetti: assets.alice
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
        url: 'https://www.roblox.com/games/store-section/9452973012',
        style: { filter: 'sepia(1) saturate(1.8) hue-rotate(-35deg) brightness(0.8) contrast(1.2)' }
    },
    donator_2: {
        type: 'header',
        userIds: [],
        icon: assets.ronetIcon,
        tooltip: 'Donated 200 or more Robux to help Support RoNet\'s development.',
        url: 'https://www.roblox.com/games/store-section/9452973012',
        style: { filter: 'grayscale(1) brightness(1.3) contrast(1.2)' }
    },
    donator_3: {
        type: 'header',
        userIds: [],
        icon: assets.ronetIcon,
        tooltip: 'Donated 500 or more Robux to help Support RoNet\'s development.',
        url: 'https://www.roblox.com/games/store-section/9452973012',
        style: { filter: 'sepia(1) saturate(3) hue-rotate(5deg) brightness(1.1)' }
    }
};