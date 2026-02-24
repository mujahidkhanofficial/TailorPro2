/**
 * Utility functions for handling Pakistani tailor fractions.
 * Maps 1/4, 1/2, 3/4 to Unicode fractions and decimal storage.
 */

// Mapping for Parsing: Unicode/Text -> Decimal string
const FRACTION_TO_DECIMAL: Record<string, string> = {
    '¼': '.25',
    '½': '.5',
    '¾': '.75',
    '1/4': '.25',
    '1/2': '.5',
    '3/4': '.75',
};

// Mapping for Display: Decimal suffix -> Unicode
const DECIMAL_TO_URI_FRACTION: Record<string, string> = {
    '.25': '¼',
    '.5': '½',
    '.50': '½',
    '.75': '¾',
};

/**
 * Parses raw input from the measurement field.
 * Converts "9 1/2", "9½", or "9.5" into a standard decimal string "9.5".
 * Returns the original string if no recognized fraction pattern is complete.
 */
export function parseMeasurementInput(input: string): string {
    if (!input) return '';

    // 1. Handle "Backspace" edge case on unicode:
    // If input is "9", it's fine.
    // If input was "9½" and user hit backspace -> "9".

    // Normalize input to handle already existing unicode chars
    // e.g. "9½" -> "9.5" to ensure math works if needed, 
    // but here we just want to standardize storage.
    let normalized = input;

    // Replace explicit unicode with decimal equivalents to allow for simple parsing
    // But wait, if we have "9½", we want "9.5".
    // Regex to find unicode fractions
    normalized = normalized.replace(/([0-9]*)\s*([¼½¾])/g, (_, number, fraction) => {
        const decimalPart = FRACTION_TO_DECIMAL[fraction];
        if (number) {
            // e.g. "9" + ".5" -> "9.5"
            return `${number}${decimalPart}`;
        }
        return `0${decimalPart}`; // "½" -> "0.5"
    });

    // 2. Handle typed text patterns "Number 1/2" globally
    // Regex checks for: (Optional Number + Space) + FractionPattern
    // Matches: "9 1/2", "1/2", "25 1/2 26 1/2"
    const textFractionRegex = /(?:(\d+)\s+)?(1\/4|1\/2|3\/4)/g;

    const parsed = normalized.replace(textFractionRegex, (_, baseNumber, fractionText) => {
        const decimalSuffix = FRACTION_TO_DECIMAL[fractionText]; // .25, .5, .75
        const number = baseNumber ? parseInt(baseNumber) : 0;
        return `${number}${decimalSuffix}`;
    });

    return parsed;
}

/**
 * Formats a stored decimal value into a display string with Unicode fractions.
 * e.g. "9.5" -> "9½"
 * e.g. "25.5 26.5" -> "25½ 26½"
 */
export function formatMeasurementDisplay(value: string): string {
    if (!value) return '';

    // Regex: Find decimals .25, .5, .50, .75 preceded optionally by digits
    // and NOT followed by other digits (to avoid matching 0.55 as 0½5)
    // Matches: "9.5", "25.5"
    const decimalPattern = /(\d*)\.(25|50|5|75)(?!\d)/g;

    return value.replace(decimalPattern, (match, baseNumber, decimalPart) => {
        const key = '.' + decimalPart;
        // Normalize .5 to find in dict if needed, or dict has both
        const unicode = DECIMAL_TO_URI_FRACTION[key];

        if (unicode) {
            return `${baseNumber}${unicode}`;
        }
        return match;
    });
}
