export interface NumberedFieldDef {
    key: string;
    number: number;
}

export interface ShapeInputDef {
    id: string;
    relX: number; // percentage X relative to shape width
    relY: number; // percentage Y relative to shape height
    width: number;
    placeX?: 'left' | 'center' | 'right' | 'manual';
    placeY?: 'top' | 'center' | 'bottom' | 'manual';
}

export interface ShapeFieldDef {
    key: string;
    number: number;
    asset: string;
    raw?: string; // inline SVG text for printing
    top: number;
    left: number;
    width: number;
    height: number;
    defaultInputs: ShapeInputDef[];
}

export interface LayoutElement {
    id: string; // Unique identifier (e.g., 'shape14', 'left1', 'cField', 'header_mob')
    type: 'svg' | 'input' | 'label' | 'damanGroup' | 'silaiGroup' | 'banGroup' | 'textBlock';
    x: number; // Left position (percentage or px depending on engine; let's stick to percentage since the original was percentage)
    y: number; // Top position (percentage)
    width?: number; // Width (percentage)
    height?: number; // Height (percentage)
    content?: any; // To store asset URL, raw SVG, text label, etc. Inputs will be { asset: string, raw: string, inputs: ShapeInputDef[] }
    fontSize?: number; // Optional styling
    color?: string;
    borderColor?: string;
    isFixed?: boolean;
    direction?: 'rtl' | 'ltr';
}

export const LEFT_NUMBERED_FIELDS: NumberedFieldDef[] = Array.from({ length: 11 }, (_, index) => ({
    key: `left${index + 1}`,
    number: index + 1,
}));

export const HEADER_FIELDS = [
    { key: 'sNo', label: 'S.No.' },
    { key: 'customerName', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'karigar', label: 'Karigar' },
];

// Raw SVG imports for embedding in printed HTML
import asset1Raw from '/SVG/Asset 1.svg?raw';
import asset2Raw from '/SVG/Asset 2.svg?raw';
import asset3Raw from '/SVG/Asset 3.svg?raw';
import asset6Raw from '/SVG/Asset 6.svg?raw';
import asset7Raw from '/SVG/Asset 7.svg?raw';
import asset8Raw from '/SVG/Asset 8.svg?raw';
import asset9Raw from '/SVG/Asset 9.svg?raw';
import asset10Raw from '/SVG/Asset 10.svg?raw';
import asset11Raw from '/SVG/Asset 11.svg?raw';
import asset12Raw from '/SVG/Asset 12.svg?raw';
import asset13Raw from '/SVG/Asset 13.svg?raw';
import asset14Raw from '/SVG/Asset 14.svg?raw';

export const SHAPE_FIELDS: ShapeFieldDef[] = [
    // Row 1: Collar (Asset 14) — full width, very top
    {
        key: 'shape14', number: 14, asset: 'Asset 14.svg', raw: asset14Raw, top: 2, left: 8, width: 82, height: 12,
        defaultInputs: [
            { id: 'shape14_1', relX: 10, relY: 50, width: 25 },
            { id: 'shape14_2', relX: 75, relY: 50, width: 25 }
        ]
    },
    // Row 2: Curved band (Asset 13) — full width, below collar
    {
        key: 'shape13', number: 13, asset: 'Asset 13.svg', raw: asset13Raw, top: 15, left: 8, width: 82, height: 6,
        defaultInputs: [
            { id: 'shape13_1', relX: 10, relY: 50, width: 25 },
            { id: 'shape13_2', relX: 75, relY: 50, width: 25 }
        ]
    },

    // Row 3: T-shape placket (Asset 10) — center, wider
    {
        key: 'shape10', number: 10, asset: 'Asset 10.svg', raw: asset10Raw, top: 24, left: 20, width: 42, height: 16,
        defaultInputs: [
            { id: 'shape10_1', relX: 10, relY: 20, width: 20 },
            { id: 'shape10_2', relX: 50, relY: 80, width: 20 }
        ]
    },
    // Vertical cuff rect (Asset 12) — far right, same row
    {
        key: 'shape12', number: 12, asset: 'Asset 12.svg', raw: asset12Raw, top: 24, left: 78, width: 8, height: 18,
        defaultInputs: [
            { id: 'shape12_1', relX: 0, relY: -10, width: 200 },
            { id: 'shape12_2', relX: 0, relY: 100, width: 200 }
        ]
    },

    // Vertical line (Asset 11) — far left, thin stroke
    {
        key: 'shape11', number: 11, asset: 'Asset 11.svg', raw: asset11Raw, top: 24, left: 3, width: 3, height: 50,
        defaultInputs: [
            { id: 'shape11_1', relX: 200, relY: 50, width: 300 }
        ]
    },

    // Row 4: Line w/ circles (Asset 9) — center-left
    {
        key: 'shape9', number: 9, asset: 'Asset 9.svg', raw: asset9Raw, top: 44, left: 25, width: 10, height: 20,
        defaultInputs: [
            { id: 'shape9_1', relX: 120, relY: 50, width: 150 }
        ]
    },
    // Triangle (Asset 1) — center-right
    {
        key: 'shape1', number: 1, asset: 'Asset 1.svg', raw: asset1Raw, top: 44, left: 50, width: 18, height: 10,
        defaultInputs: [
            { id: 'shape1_1', relX: 30, relY: 70, width: 40 }
        ]
    },
    // Pie slice (Asset 6) — far right
    {
        key: 'shape6', number: 6, asset: 'Asset 6.svg', raw: asset6Raw, top: 44, left: 75, width: 14, height: 16,
        defaultInputs: [
            { id: 'shape6_1', relX: 10, relY: 20, width: 60 },
            { id: 'shape6_2', relX: 10, relY: 80, width: 60 }
        ]
    },

    // Row 5: Plain square (Asset 8) — center-left
    {
        key: 'shape8', number: 8, asset: 'Asset 8.svg', raw: asset8Raw, top: 67, left: 25, width: 14, height: 14,
        defaultInputs: [
            { id: 'shape8_1', relX: 10, relY: 80, width: 80 }
        ]
    },
    // Notched square (Asset 7) — center-right
    {
        key: 'shape7', number: 7, asset: 'Asset 7.svg', raw: asset7Raw, top: 67, left: 50, width: 14, height: 14,
        defaultInputs: [
            { id: 'shape7_1', relX: -20, relY: 80, width: 50 },
            { id: 'shape7_2', relX: 50, relY: 80, width: 50 }
        ]
    },
];

export const DAMAN_OPTIONS = [
    { key: 'daman_curved', asset: 'Asset 3.svg', raw: asset3Raw, labelUr: 'گول دامن' },
    { key: 'daman_straight', asset: 'Asset 2.svg', raw: asset2Raw, labelUr: 'سیدھا دامن' },
];

export const SILAI_OPTIONS = [
    { key: 'silai_single', labelUr: 'سنگل سلائی' },
    { key: 'silai_double_dd', labelUr: 'ڈبل سلائی D.D' },
    { key: 'silai_triple', labelUr: 'ٹرپل سلائی' },
    { key: 'silai_double', labelUr: 'ڈبل سلائی' },
];

export const BAN_OPTIONS = [
    { key: 'ban_half_gol', labelUr: 'ہاف بین گول' },
    { key: 'ban_half_seedha', labelUr: 'ہاف بین سیدھا' },
    { key: 'ban_full_gol', labelUr: 'فل بین گول' },
    { key: 'ban_full_seedha', labelUr: 'فل بین سیدھا' },
];

export const ALL_MEASUREMENT_FIELD_KEYS: string[] = [
    ...HEADER_FIELDS.map(f => f.key),
    ...LEFT_NUMBERED_FIELDS.map(f => f.key),
    ...SHAPE_FIELDS.flatMap(f => f.defaultInputs.map(i => i.id)),
    'silai_selected',
    'daman_selected',
    'ban_selected',
];

// Combine everything into a flat array of LayoutElements for the dynamic editor
export const DEFAULT_LAYOUT: LayoutElement[] = [
    // --- Header Block (approx Top 12%) ---
    { id: 'header_title', type: 'textBlock', x: 0, y: 2, width: 100, content: 'نظام ٹیلرز', fontSize: 36, color: '#0f172a', isFixed: true },
    { id: 'header_subtitle', type: 'textBlock', x: 0, y: 8, width: 100, content: 'Contact No:', fontSize: 12, color: '#64748b', isFixed: true },

    // Divider Line
    { id: 'header_divider', type: 'textBlock', x: 2, y: 12, width: 96, height: 0.2, content: '', color: '#cbd5e1', isFixed: true },

    // --- Left Column Header (approx Top 14%) ---
    // Header labels row
    { id: 'header_label_sno', type: 'textBlock', x: 2, y: 14, width: 15, content: 'S.No.', fontSize: 12, color: '#475569', isFixed: true },
    { id: 'header_label_name', type: 'textBlock', x: 18, y: 14, width: 35, content: 'Name', fontSize: 12, color: '#475569', isFixed: true },
    { id: 'header_label_phone', type: 'textBlock', x: 54, y: 14, width: 25, content: 'Phone', fontSize: 12, color: '#475569', isFixed: true },
    { id: 'header_label_karigar', type: 'textBlock', x: 80, y: 14, width: 18, content: 'Karigar', fontSize: 12, color: '#475569', isFixed: true },

    // Header values row (tightened to remove vertical gap)
    { id: 'header_val_sno', type: 'input', x: 2, y: 15, width: 15, height: 4.5, content: { label: '', field: 'sNo', hideLabel: true }, isFixed: true },
    { id: 'header_val_name', type: 'input', x: 18, y: 15, width: 35, height: 4.5, content: { label: '', field: 'customerName', hideLabel: true }, isFixed: true },
    { id: 'header_val_phone', type: 'input', x: 54, y: 15, width: 25, height: 4.5, content: { label: '', field: 'phone', hideLabel: true }, isFixed: true },
    { id: 'header_val_karigar', type: 'input', x: 80, y: 15, width: 18, height: 4.5, content: { label: '', field: 'karigar', hideLabel: true }, isFixed: true },

    // --- Left Numbered Column (11 inputs, from Top 19.5% down) ---
    ...LEFT_NUMBERED_FIELDS.map((f, i) => ({
        id: `left_row_${i}`,
        type: 'input' as const,
        x: 2,
        y: 19.5 + (i * 4.5), // start just below tightened header rows
        width: 30,
        height: 4.5,
        content: { label: f.number.toString(), field: f.key, hideLabel: true },
        isFixed: true,
    })),



    // --- Bottom Left Urdu Note (from Top 72%) ---
    {
        id: 'bottom_left_note',
        type: 'textBlock',
        x: 2,
        y: 72,
        width: 30,
        height: 24,
        content: '', // Removed from here, moved to footer
        fontSize: 12,
        color: '#475569',
        isFixed: true,
        direction: 'rtl',
    },

    // --- SVG Shapes and their nested Inputs (Right area, starting Top 20%) ---
    ...SHAPE_FIELDS.map(shape => {
        const svgElement: LayoutElement = {
            id: `svg_${shape.key}`,
            type: 'svg',
            x: 35 + (shape.left * 0.63), // Map into the right 63% area
            y: 24 + (shape.top * 0.75), // moved base down to avoid overlapping header rows
            width: shape.width * 0.63,
            height: shape.height * 0.75,
            content: { asset: shape.asset, raw: shape.raw, inputs: shape.defaultInputs }
        };

        return svgElement;
    }),

    // --- Daman Options (Bottom Right area) ---
    {
        id: 'damanGroup',
        type: 'damanGroup',
        x: 38,
        y: 82,  // higher to make room below
        width: 20,
        height: 10,
        content: { options: DAMAN_OPTIONS }
    },

    // --- Silai Options (Bottom Right area) ---
    {
        id: 'silaiGroup',
        type: 'silaiGroup',
        x: 65,
        y: 92,  // start right after damanGroup bottom (82+10)
        width: 30,
        height: 12,
        content: { options: SILAI_OPTIONS }
    },

    // --- Ban (Collar) Options ---
    {
        id: 'banGroup',
        type: 'banGroup',
        x: 65,
        y: 82,
        width: 30,
        height: 8,
        content: { options: BAN_OPTIONS }
    }
];
