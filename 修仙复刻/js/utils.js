/**
 * Utility Functions
 */

// Format number for display
function formatNum(num) {
    if (num instanceof BigNum) return num.toString();
    if (num === Infinity) return "∞";
    if (typeof num === 'number') {
        if (Math.abs(num) < 0.01 && num !== 0) return num.toExponential(2);
        return parseFloat(num.toFixed(2)).toString();
    }
    return num;
}

// Get weighted random item from object or array
function getWeightedRandom(items, weightKey = 'weight') {
    let totalWeight = 0;
    const isArray = Array.isArray(items);
    const keys = isArray ? items : Object.keys(items);
    
    keys.forEach(k => {
        totalWeight += (isArray ? k[weightKey] : items[k][weightKey]);
    });

    let randomVal = Math.random() * totalWeight;
    for (let k of keys) {
        let w = isArray ? k[weightKey] : items[k][weightKey];
        if (randomVal < w) return isArray ? k : k;
        randomVal -= w;
    }
    return isArray ? keys[keys.length-1] : keys[keys.length-1];
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { formatNum, getWeightedRandom };
}
