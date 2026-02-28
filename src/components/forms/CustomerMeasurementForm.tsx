import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { db, CustomerMeasurement } from '@/db/database';
import { Save, Printer, RotateCcw, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { useAutosave } from '@/hooks/useAutosave';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import toast from 'react-hot-toast';
import { parseMeasurementInput, formatMeasurementDisplay } from '@/utils/fractionUtils';
import { ALL_MEASUREMENT_FIELD_KEYS, LayoutElement, DEFAULT_LAYOUT, DAMAN_OPTIONS, SILAI_OPTIONS, BAN_OPTIONS } from '@/utils/slipLayout';

interface CustomerMeasurementFormProps {
    customerId: number;
    customerName?: string;
    onPrint?: (measurement: CustomerMeasurement) => void;
    onPreview?: (measurement: CustomerMeasurement) => void;
}

export default function CustomerMeasurementForm({
    customerId,
    customerName,
    onPrint,
    onPreview
}: CustomerMeasurementFormProps) {
    const { i18n } = useTranslation();
    const isUrdu = i18n.language === 'ur';

    const [fields, setFields] = useState<Record<string, string>>({});
    const [options, setOptions] = useState<Record<string, boolean>>({});
    const [existingId, setExistingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [customerPhone, setCustomerPhone] = useState<string>('');

    // Dynamic Layout State
    const [layout, setLayout] = useState<LayoutElement[]>(DEFAULT_LAYOUT);
    const [shopSettings, setShopSettings] = useState<any>(null);

    // Stable change handler
    const handleFieldChange = useCallback((key: string, value: string) => {
        setFields((prev) => ({ ...prev, [key]: parseMeasurementInput(value) }));
    }, []);

    // Load existing measurements & layout on mount
    useEffect(() => {
        loadMeasurementsAndLayout();
    }, [customerId]);

    async function loadMeasurementsAndLayout() {
        setLoading(true);
        try {
            // Load Settings for layout
            const settings = await db.settings.toCollection().first();
            if (settings) {
                setShopSettings(settings);
                const savedLayout = settings.slipLayout && settings.slipLayout.length > 0 ? settings.slipLayout : DEFAULT_LAYOUT;
                const mergedLayout = DEFAULT_LAYOUT.map(defaultEl => {
                    if (defaultEl.isFixed) return defaultEl;
                    const savedEl = savedLayout.find((el: any) => el.id === defaultEl.id);
                    return savedEl || defaultEl;
                });
                setLayout(mergedLayout);
            } else {
                setLayout(DEFAULT_LAYOUT);
            }

            // Load Customer Phone
            const customer = await db.customers.get(customerId);
            if (customer) {
                setCustomerPhone(customer.phone);
            }

            // Load Measurements
            const existing = await db.customerMeasurements
                .where('customerId')
                .equals(customerId)
                .first();

            if (existing) {
                const loaded = existing.fields || {};
                // if older entries didn't include sNo, use the record ID
                if (!loaded.sNo && existing.id) {
                    loaded.sNo = existing.id.toString();
                }
                setFields(loaded);
                setOptions(existing.designOptions || {});
                setExistingId(existing.id || null);
            } else {
                const emptyFields: Record<string, string> = {};
                ALL_MEASUREMENT_FIELD_KEYS.forEach((fieldKey) => {
                    emptyFields[fieldKey] = '';
                });
                // auto‑generate S.No from the database's auto‑increment ID sequence
                const last = await db.customerMeasurements.orderBy('id').last();
                const nextId = last && last.id ? last.id + 1 : 1;
                emptyFields['sNo'] = nextId.toString();
                setFields(emptyFields);
            }
        } catch (error) {
            console.error('Error loading measurements:', error);
        }
        setLoading(false);
    }

    const saveData = useCallback(async (data: { fields: Record<string, string>, options: Record<string, boolean> }) => {
        const now = new Date();
        try {
            if (existingId) {
                // Update existing
                await db.customerMeasurements.update(existingId, {
                    fields: data.fields,
                    designOptions: data.options,
                    updatedAt: now,
                });
            } else {
                // Create new
                const id = await db.customerMeasurements.add({
                    customerId,
                    fields: data.fields,
                    designOptions: data.options,
                    createdAt: now,
                    updatedAt: now,
                });
                setExistingId(id);
            }
        } catch (error) {
            console.error('Error saving measurements:', error);
            throw error;
        }
    }, [existingId, customerId]);

    const saveStatus = useAutosave({ fields, options }, saveData, 1000);

    function handleReset() {
        setShowResetConfirm(true);
    }

    function confirmReset() {
        const emptyFields: Record<string, string> = {};
        ALL_MEASUREMENT_FIELD_KEYS.forEach((fieldKey) => {
            emptyFields[fieldKey] = '';
        });
        setFields(emptyFields);

        setOptions({});
        setShowResetConfirm(false);
        toast.success(isUrdu ? 'ناپ صاف کر دیے گئے' : 'Measurements cleared successfully');
    }

    function handlePrint() {
        if (onPrint) {
            const measurement: CustomerMeasurement = {
                id: existingId || undefined,
                customerId,
                fields,
                designOptions: options,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            onPrint(measurement);
        }
    }

    function handlePreview() {
        if (onPreview) {
            const measurement: CustomerMeasurement = {
                id: existingId || undefined,
                customerId,
                fields,
                designOptions: options,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            onPreview(measurement);
        } else {
            console.error('onPreview prop is missing');
            toast.error('Preview feature not connected');
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                    {isUrdu ? 'ناپ پرچی' : 'Measurement Slip'}
                    {saveStatus === 'saving' && (
                        <span className="text-xs font-normal text-gray-500 flex items-center gap-1 animate-pulse bg-gray-100 px-2 py-1 rounded-full">
                            <Save className="w-3 h-3" /> {isUrdu ? 'محفوظ ہو رہا ہے...' : 'Saving...'}
                        </span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="text-xs font-normal text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" /> {isUrdu ? 'محفوظ' : 'Saved'}
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-xs font-normal text-red-600 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full">
                            <AlertCircle className="w-3 h-3" /> {isUrdu ? 'خرابی' : 'Error'}
                        </span>
                    )}
                </h3>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="btn btn-danger text-sm flex items-center gap-1"
                    >
                        <RotateCcw className="w-4 h-4" />
                        {isUrdu ? 'ری سیٹ' : 'Reset'}
                    </button>
                    <button
                        type="button"
                        onClick={handlePreview}
                        className="btn btn-secondary text-sm flex items-center gap-2"
                        title={isUrdu ? 'پریویو' : 'Preview'}
                    >
                        <Eye className="w-4 h-4" />
                        {isUrdu ? 'پریویو' : 'Preview'}
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="btn btn-primary text-sm flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        {isUrdu ? 'پرنٹ' : 'Print'}
                    </button>
                </div>
            </div>

            {/* Simulated physical measurement slip layout */}
            <div className="flex justify-center w-full overflow-x-auto pb-4">
                <div
                    className="bg-white relative shadow-inner transition-all duration-300"
                    style={{
                        width: '500px',
                        height: shopSettings?.slipPageSize === 'A4' ? '707px' : '700px', // Adjust height based on page size
                        border: '1px solid #cbd5e1',
                        fontFamily: 'sans-serif',
                        color: '#0f172a'
                    }}
                    dir="ltr"
                >
                    {layout.map((element) => {
                        const style: React.CSSProperties = {
                            position: 'absolute',
                            top: `${element.y}%`,
                            left: `${element.x}%`,
                            width: element.width ? `${element.width}%` : 'auto',
                            height: element.height ? `${element.height}%` : 'auto',
                        };

                        if (element.type === 'textBlock') {
                            let contentStr = element.content;
                            if (element.id === 'header_title' && shopSettings?.shopName) {
                                contentStr = shopSettings.shopName;
                            }
                            if (element.id === 'header_subtitle' && shopSettings?.phone1) {
                                contentStr = `Contact No: ${shopSettings.phone1}`;
                            }

                            if (element.id === 'header_divider') {
                                return <div key={element.id} style={{ ...style, backgroundColor: element.color || '#cbd5e1' }} />;
                            }

                            const fontFamily = element.direction === 'rtl' ? "'NotoNastaliqUrdu', serif" : 'Arial, sans-serif';
                            return (
                                <div key={element.id} style={{ ...style, direction: element.direction || 'ltr', fontFamily }} className="flex items-center justify-center text-center font-bold">
                                    <div style={{ fontSize: `${element.fontSize || 14}px`, color: element.color || '#0f172a' }}>
                                        {contentStr.split('\n').map((line: string, i: number) => (
                                            <div key={i}>{line}</div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        if (element.type === 'input') {
                            return (
                                <div key={element.id} style={style} className="flex items-center">
                                    {!element.content.hideLabel && (
                                        <span className="font-semibold text-slate-600 px-1.5 text-[13px] shrink-0 whitespace-nowrap bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
                                            {element.content.label}
                                        </span>
                                    )}
                                    <input
                                        type="text"
                                        value={
                                            element.content.field === 'customerName' ? customerName || '' :
                                            element.content.field === 'phone' ? customerPhone || '' :
                                            formatMeasurementDisplay(fields[element.content.field] || '')
                                        }
                                        onChange={(e) => handleFieldChange(element.content.field, e.target.value)}
                                        readOnly={element.content.field === 'sNo' || element.content.field === 'customerName' || element.content.field === 'phone'}
                                        className={`flex-1 min-w-0 w-full outline-none text-slate-900 font-bold px-1.5 text-sm bg-transparent z-10 ${element.content.hideLabel ? 'text-center text-base' : ''
                                            } ${element.content.field === 'sNo' || element.content.field === 'customerName' || element.content.field === 'phone' ? 'cursor-not-allowed opacity-80' : ''}`}
                                        style={{ fontFamily: 'Arial, sans-serif' }}
                                        dir="ltr"
                                    />
                                    {element.content.dottedLine ? (
                                        <div className="absolute left-6 right-1 bottom-1 border-b border-dashed border-slate-300 z-0 pointer-events-none" />
                                    ) : (
                                        <div className="absolute left-0 right-0 bottom-0 border-b border-slate-300 z-0 pointer-events-none" />
                                    )}
                                </div>
                            );
                        }

                        if (element.type === 'svg') {
                            const svgBase64 = element.content.raw
                                ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(element.content.raw.replace(/\\n/g, ''))}`
                                : `/SVG/${element.content.asset}`;

                            return (
                                <div key={element.id} style={style} className="relative pointer-events-none">
                                    <img
                                        src={svgBase64}
                                        alt={element.id}
                                        className="w-full h-full object-contain pointer-events-none"
                                        style={{ filter: "brightness(0) saturate(100%) invert(32%) sepia(13%) saturate(831%) hue-rotate(176deg) brightness(95%) contrast(88%)" }}
                                        draggable={false}
                                    />
                                    {/* Nested Inputs inside the SVG */}
                                    {(element.content.inputs || []).map((inp: any) => {
                                        const valStr = formatMeasurementDisplay((fields[inp.id] || '').toString());
                                        const chWidth = Math.max(2.5, valStr.length + 0.5); // At least 2.5ch width
                                        let left = `${inp.relX}%`;
                                        if (inp.placeX === 'left') left = '0%';
                                        if (inp.placeX === 'right') left = '100%';
                                        if (inp.placeX === 'center') left = '50%';

                                        let top = `${inp.relY}%`;
                                        if (inp.placeY === 'top') top = '0%';
                                        if (inp.placeY === 'bottom') top = '100%';
                                        if (inp.placeY === 'center') top = '50%';

                                        let transform = `translate(-50%, -50%)`;
                                        if (inp.placeX === 'left') transform = transform.replace('-50%', '0%');
                                        if (inp.placeX === 'right') transform = transform.replace('-50%', '-100%');
                                        if (inp.placeY === 'top') transform = transform.replace(/, -50%\)/, ', 0%)');
                                        if (inp.placeY === 'bottom') transform = transform.replace(/, -50%\)/, ', -100%)');

                                        return (
                                            <input
                                                key={inp.id}
                                                type="text"
                                                value={valStr}
                                                onChange={(e) => handleFieldChange(inp.id, e.target.value)}
                                                className={`absolute outline-none text-slate-900 font-bold rounded-sm z-10 text-center pointer-events-auto transition-all focus:bg-white focus:ring-1 focus:ring-slate-400 ${!valStr ? 'bg-slate-200/60' : 'bg-transparent hover:bg-slate-100/50'
                                                    }`}
                                                style={{
                                                    left,
                                                    top,
                                                    width: `${chWidth}ch`,
                                                    transform,
                                                    fontFamily: 'Arial, sans-serif'
                                                }}
                                                dir="ltr"
                                            />
                                        );
                                    })}
                                </div>
                            );
                        }

                        if (element.type === 'damanGroup') {
                            const options = element.content?.options || DAMAN_OPTIONS;
                            return (
                                <div key={element.id} style={style} className="flex items-end justify-center gap-4 font-urdu">
                                    {options.map((opt: any) => (
                                        <label key={opt.key} className="flex flex-col items-center cursor-pointer">
                                            <img
                                                src={`/SVG/${opt.asset}`}
                                                alt={opt.labelUr || opt.label}
                                                className="w-10 h-8 object-contain"
                                                style={{ filter: 'brightness(0) saturate(100%) invert(32%) sepia(13%) saturate(831%) hue-rotate(176deg) brightness(95%) contrast(88%)' }}
                                                draggable={false}
                                            />
                                            <span className="text-[11px] font-semibold mt-1 text-slate-600 whitespace-nowrap font-urdu">
                                                {opt.labelUr || opt.label || ''}
                                            </span>
                                            <input
                                                type="radio"
                                                name="daman_option"
                                                checked={fields['daman_selected'] === opt.key}
                                                onChange={() => handleFieldChange('daman_selected', opt.key)}
                                                className="w-4 h-4 accent-slate-800 cursor-pointer mt-1"
                                            />
                                        </label>
                                    ))}
                                </div>
                            );
                        }

                        if (element.type === 'silaiGroup') {
                            const options = element.content?.options || SILAI_OPTIONS;
                            return (
                                <div key={element.id} style={style} className="flex flex-col justify-center text-xs font-semibold text-slate-600 font-urdu px-2">
                                    <select
                                        value={fields['silai_selected'] || ''}
                                        onChange={(e) => handleFieldChange('silai_selected', e.target.value)}
                                        className="w-full p-1 border rounded text-right font-urdu bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                                        style={{ fontFamily: "'NotoNastaliqUrdu', serif" }}
                                        dir="rtl"
                                    >
                                        <option value="" disabled>منتخب کریں</option>
                                        {options.map((opt: any) => (
                                            <option key={opt.key} value={opt.key}>
                                                {opt.labelUr || opt.label || ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            );
                        }

                        if (element.type === 'banGroup') {
                            const options = element.content?.options || BAN_OPTIONS;
                            return (
                                <div key={element.id} style={style} className="flex flex-col justify-center text-xs font-semibold text-slate-600 font-urdu px-2">
                                    <select
                                        value={fields['ban_selected'] || ''}
                                        onChange={(e) => handleFieldChange('ban_selected', e.target.value)}
                                        className="w-full p-1 border rounded text-right font-urdu bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                                        style={{ fontFamily: "'NotoNastaliqUrdu', serif" }}
                                        dir="rtl"
                                    >
                                        <option value="" disabled>بین کا انتخاب</option>
                                        {options.map((opt: any) => (
                                            <option key={opt.key} value={opt.key}>
                                                {opt.labelUr || opt.label || ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            );
                        }

                        return null;
                    })}

                </div>
            </div>
            
            {/* Footer Note */}
            <div className="flex justify-center w-full pb-4">
                <div className="w-[500px] text-center text-slate-600 text-sm border-t border-dashed border-slate-300 pt-3" style={{ fontFamily: "'NotoNastaliqUrdu', serif" }} dir="rtl">
                    رسید گم ہو جانے پر اگر عدد میں کسی قسم کی بھی غلطی ہوئی تو اس کا ذمہ دار کاریگر ہوگا۔
                </div>
            </div>

            <ConfirmationModal
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={confirmReset}
                title={isUrdu ? 'ری سیٹ کی تصدیق' : 'Reset Confirmation'}
                message={isUrdu ? 'کیا آپ واقعی تمام ناپ صاف کرنا چاہتے ہیں؟' : 'Are you sure you want to clear all measurements?'}
                confirmText={isUrdu ? 'ری سیٹ' : 'Reset'}
            />
        </div >
    );
}
