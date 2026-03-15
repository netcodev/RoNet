/**
 * Muffle known roavatar-renderer / Three.js / RBX parser warnings and errors
 * that we cannot fix upstream. Runs once on load.
 */
const MUFFLE_PATTERNS = [
    'Multiple instances of Three.js',
    'Failed to parse path of',
    'Unknown property type',
    'Motor6D/Weld is missing parent',
    'No default found for animation',
    'Failed to compile mesh',
    "parameter 'metalnessMap' has value of undefined",
    "parameter 'emissiveMap' has value of undefined",
    "parameter 'roughnessMap' has value of undefined",
    'Parsing RBX xml file, the result may not be accurate',
    'Tree already generated',
    'Missing either part0 or part1 with names:',
];

function messageMatches(msg) {
    if (typeof msg !== 'string') return false;
    return MUFFLE_PATTERNS.some((p) => msg.includes(p));
}

const origWarn = console.warn;
const origError = console.error;

console.warn = function (...args) {
    if (args.length > 0 && messageMatches(args[0])) return;
    return origWarn.apply(console, args);
};

console.error = function (...args) {
    if (args.length > 0 && messageMatches(args[0])) return;
    return origError.apply(console, args);
};
