import { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Save, X, RotateCcw } from 'lucide-react';
import { db } from '@/db/database';
import { DEFAULT_LAYOUT, LayoutElement } from '@/utils/slipLayout';
import toast from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function TemplateDesigner({ isOpen, onClose }: Props) {
    const [layout, setLayout] = useState<LayoutElement[]>(DEFAULT_LAYOUT);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState<'A4' | 'A5'>('A5');

    useEffect(() => {
        if (isOpen) {
            loadLayout();
        }
    }, [isOpen]);

    const loadLayout = async () => {
        const settings = await db.settings.toCollection().first();
        if (settings?.slipPageSize) {
            setPageSize(settings.slipPageSize);
        }
        if (settings?.slipLayout && settings.slipLayout.length > 0) {
            const mergedLayout = DEFAULT_LAYOUT.map(defaultEl => {
                if (defaultEl.isFixed) return defaultEl; // Enforce default coordinates for fixed items
                const savedEl = settings.slipLayout!.find((el: any) => el.id === defaultEl.id);
                return savedEl || defaultEl;
            });
            setLayout(mergedLayout);
        } else {
            setLayout(DEFAULT_LAYOUT);
        }
    };

    const handleSave = async () => {
        try {
            const settings = await db.settings.toCollection().first();
            if (settings && settings.id) {
                await db.settings.update(settings.id, {
                    slipLayout: layout,
                    slipPageSize: pageSize,
                    updatedAt: new Date()
                });
            } else {
                await db.settings.add({
                    shopName: 'Tailor Pro',
                    address: '',
                    phone1: '',
                    phone2: '',
                    slipLayout: layout,
                    slipPageSize: pageSize,
                    updatedAt: new Date()
                });
            }
            toast.success('Template layout saved!');
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save layout');
        }
    };

    const handleReset = () => {
        if (window.confirm('Reset to default layout? All custom positioning will be lost.')) {
            setLayout(DEFAULT_LAYOUT);
        }
    };

    if (!isOpen) return null;

    // Helper to render the content of a LayoutElement visually
    const renderElementContent = (element: LayoutElement) => {
        switch (element.type) {
            case 'textBlock':
                if (element.id === 'header_divider') {
                    return <div className="w-full h-full" style={{ backgroundColor: element.color || '#cbd5e1' }} />;
                }
                const textFont = element.direction === 'rtl' ? "'NotoNastaliqUrdu', serif" : 'sans-serif';
                return (
                    <div
                        className="w-full h-full flex items-center justify-center text-center font-bold"
                        style={{ fontSize: `${element.fontSize || 14}px`, color: element.color || '#0f172a', direction: element.direction || 'ltr', fontFamily: textFont }}
                    >
                        {element.content.split('\n').map((line: string, i: number) => (
                            <div key={i}>{line}</div>
                        ))}
                    </div>
                );
            case 'input':
                return (
                    <div className="w-full h-full flex items-center border border-dashed border-slate-300 bg-white/50 relative">
                        {!element.content.hideLabel && (
                            <span className="font-semibold text-slate-600 text-[13px] px-1.5 shrink-0" style={{ fontFamily: 'Arial, sans-serif' }}>{element.content.label}</span>
                        )}
                        <div className={`absolute left-0 right-0 bottom-0 border-b border-slate-300 z-0 pointer-events-none ${element.content.dottedLine ? 'border-dashed' : 'border-solid'}`}></div>
                    </div>
                );
            case 'svg':
                return (
                    <div className="w-full h-full relative group/svg">
                        {element.content.raw ? (
                            <div dangerouslySetInnerHTML={{ __html: element.content.raw }} className="w-full h-full text-slate-800 [&>svg]:w-full [&>svg]:h-full pointer-events-none" style={{ filter: 'brightness(0) saturate(100%) invert(32%) sepia(13%) saturate(831%) hue-rotate(176deg) brightness(95%) contrast(88%)' }} />
                        ) : (
                            <img src={`/SVG/${element.content.asset}`} alt={element.id} className="w-full h-full object-contain pointer-events-none" style={{ filter: 'brightness(0) saturate(100%) invert(32%) sepia(13%) saturate(831%) hue-rotate(176deg) brightness(95%) contrast(88%)' }} />
                        )}
                        {(element.content.inputs || []).map((inp: any, idx: number) => {
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
                                <div
                                    key={inp.id || idx}
                                    className="absolute bg-gray-200/60 border border-blue-400 border-dashed rounded-sm flex items-center justify-center overflow-visible px-1"
                                    style={{ left, top, minWidth: '3ch', height: '24px', transform, fontFamily: 'Arial, sans-serif' }}
                                >
                                    <span className="text-[10px] text-blue-700 font-bold whitespace-nowrap">{inp.id}</span>
                                </div>
                            );
                        })}
                    </div>
                );
            case 'damanGroup': {
                const options = element.content?.options || [
                    { key: 'daman_curved', asset: 'Asset 3.svg', labelUr: 'گول دامن' },
                    { key: 'daman_straight', asset: 'Asset 2.svg', labelUr: 'سیدھا دامن' },
                ];
                return (
                    <div className="w-full h-full flex items-end justify-center gap-4 font-urdu">
                        {options.map((opt: any) => (
                            <div key={opt.key} className="flex flex-col items-center">
                                <img
                                    src={`/SVG/${opt.asset}`}
                                    alt={opt.labelUr}
                                    className="w-10 h-8 object-contain pointer-events-none"
                                    style={{ filter: 'brightness(0) saturate(100%) invert(32%) sepia(13%) saturate(831%) hue-rotate(176deg) brightness(95%) contrast(88%)' }}
                                    draggable={false}
                                />
                                <div className="w-4 h-4 rounded-full border border-slate-300 mt-1" />
                                <span className="mt-1 text-[11px] font-semibold text-slate-600 font-urdu">{opt.labelUr || opt.label}</span>
                            </div>
                        ))}
                    </div>
                );
            }
            case 'silaiGroup': {
                return (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-full border border-slate-300 rounded px-2 py-1 bg-white text-right flex items-center justify-between">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            <span className="text-sm text-slate-600 font-urdu" style={{ fontFamily: "'NotoNastaliqUrdu', serif" }}>سلائی کا انتخاب</span>
                        </div>
                    </div>
                );
            }
            case 'banGroup': {
                return (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-full border border-slate-300 rounded px-2 py-1 bg-white text-right flex items-center justify-between">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            <span className="text-sm text-slate-600 font-urdu" style={{ fontFamily: "'NotoNastaliqUrdu', serif" }}>بین کا انتخاب</span>
                        </div>
                    </div>
                );
            }
            default:
                return <div className="w-full h-full bg-gray-200">Unknown</div>;
        }
    };

    // Helper to edit the selected element
    const updateSelectedElement = (updates: Partial<LayoutElement>) => {
        if (!selectedId) return;
        setLayout(prev => prev.map(el => el.id === selectedId ? { ...el, ...updates } : el));
    };

    const updateSelectedContent = (contentUpdates: any) => {
        if (!selectedId) return;
        setLayout(prev => prev.map(el => {
            if (el.id === selectedId) {
                return { ...el, content: { ...el.content, ...contentUpdates } };
            }
            return el;
        }));
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(layout));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `TailorPro_Layout_${pageSize}.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedLayout = JSON.parse(event.target?.result as string);
                if (Array.isArray(importedLayout)) {
                    const mergedLayout = DEFAULT_LAYOUT.map(defaultEl => {
                        if (defaultEl.isFixed) return defaultEl; // Enforce fixed from defaults
                        const importedEl = importedLayout.find((el: any) => el.id === defaultEl.id);
                        return importedEl || defaultEl;
                    });
                    setLayout(mergedLayout);
                    toast.success('Layout imported successfully!');
                } else {
                    toast.error('Invalid layout file format.');
                }
            } catch (err) {
                toast.error('Failed to parse layout file.');
            }
        };
        reader.readAsText(file);
        // Reset file input
        e.target.value = '';
    };

    const selectedElement = layout.find(el => el.id === selectedId);

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/90 flex flex-col">
            {/* Header Toolbar */}
            <div className="bg-white px-6 py-4 flex justify-between items-center shadow-md z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Template Designer</h2>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-gray-500">Drag and resize elements to customize your printed slip layout.</p>

                        <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                            <label className="text-sm font-medium text-gray-700">Page Size:</label>
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(e.target.value as 'A4' | 'A5')}
                                className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="A5">A5 (Half Letter)</option>
                                <option value="A4">A4 (Full Letter)</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                            <button onClick={handleExport} className="text-sm text-blue-600 hover:text-blue-800 underline">
                                Export JSON
                            </button>
                            <span className="text-gray-300">|</span>
                            <label className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer">
                                Import JSON
                                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleReset} className="btn btn-secondary flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" /> Reset to Default
                    </button>
                    <button onClick={handleSave} className="btn btn-primary flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save Layout
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Canvas Area */}
                <div
                    className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center items-start outline-none"
                    onClick={(e) => {
                        // Deselect if clicking directly on the background gray area
                        if (e.target === e.currentTarget) setSelectedId(null);
                    }}
                >
                    {/* The "Paper" Container */}
                    <div
                        className="relative bg-white shadow-2xl transition-all duration-300"
                        style={{
                            width: '500px',
                            height: pageSize === 'A4' ? '707px' : '700px',
                            border: '1px solid #cbd5e1'
                        }}
                    >
                        {layout.map((element, index) => {
                            if (element.isFixed) {
                                return (
                                    <div
                                        key={element.id}
                                        style={{
                                            position: 'absolute',
                                            top: `${element.y}%`,
                                            left: `${element.x}%`,
                                            width: element.width ? `${element.width}%` : 'auto',
                                            height: element.height ? `${element.height}%` : 'auto',
                                        }}
                                        className="pointer-events-none"
                                    >
                                        {renderElementContent(element)}
                                    </div>
                                );
                            }

                            return (
                                <Rnd
                                    key={element.id}
                                    bounds="parent"
                                    size={{
                                        width: element.width ? `${element.width}%` : 'auto',
                                        height: element.height ? `${element.height}%` : 'auto'
                                    }}
                                    position={{
                                        x: (element.x / 100) * 500,
                                        y: (element.y / 100) * (pageSize === 'A4' ? 707 : 700)
                                    }}
                                    onDragStop={(_e, d) => {
                                        const newLayout = [...layout];
                                        newLayout[index].x = (d.x / 500) * 100;
                                        newLayout[index].y = (d.y / (pageSize === 'A4' ? 707 : 700)) * 100;
                                        setLayout(newLayout);
                                    }}
                                    onResizeStop={(_e, _direction, ref, _delta, position) => {
                                        const newLayout = [...layout];
                                        newLayout[index].width = (ref.offsetWidth / 500) * 100;
                                        newLayout[index].height = (ref.offsetHeight / (pageSize === 'A4' ? 707 : 700)) * 100;
                                        newLayout[index].x = (position.x / 500) * 100;
                                        newLayout[index].y = (position.y / (pageSize === 'A4' ? 707 : 700)) * 100;
                                        setLayout(newLayout);
                                    }}
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation(); // Prevent background click from deselecting
                                        setSelectedId(element.id);
                                    }}
                                    className={`group ${selectedId === element.id ? 'ring-2 ring-blue-500 z-10' : 'hover:ring-1 hover:ring-gray-300 z-0'}`}
                                >
                                    {renderElementContent(element)}

                                    {/* Hover label for dragging */}
                                    <div className="absolute -top-6 left-0 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                                        {element.id}
                                    </div>
                                </Rnd>
                            );
                        })}
                    </div>
                </div>

                {/* Properties Panel (Right Sidebar) */}
                {selectedElement && (
                    <div className="w-80 bg-white border-l border-gray-200 shadow-xl overflow-y-auto flex flex-col">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Properties</h3>
                            <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Selected Element</label>
                                <div className="p-2 bg-blue-50 text-blue-700 font-mono text-sm rounded border border-blue-100 break-all">
                                    {selectedElement.id}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                    Type: <span className="font-medium">{selectedElement.type}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Dimensions & Position</label>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">X (%)</label>
                                        <input
                                            type="number"
                                            value={Math.round(selectedElement.x)}
                                            onChange={(e) => updateSelectedElement({ x: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Y (%)</label>
                                        <input
                                            type="number"
                                            value={Math.round(selectedElement.y)}
                                            onChange={(e) => updateSelectedElement({ y: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Width (%)</label>
                                        <input
                                            type="number"
                                            value={selectedElement.width ? Math.round(selectedElement.width) : ''}
                                            onChange={(e) => updateSelectedElement({ width: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Auto"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Height (%)</label>
                                        <input
                                            type="number"
                                            value={selectedElement.height ? Math.round(selectedElement.height) : ''}
                                            onChange={(e) => updateSelectedElement({ height: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Auto"
                                        />
                                    </div>
                                </div>
                            </div>

                            {(selectedElement.type === 'textBlock' || selectedElement.type === 'input') && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Styling</label>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Font Size (px)</label>
                                        <input
                                            type="number"
                                            value={selectedElement.fontSize || 14}
                                            onChange={(e) => updateSelectedElement({ fontSize: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>

                                    {selectedElement.type === 'textBlock' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={selectedElement.color || '#ef4444'}
                                                    onChange={(e) => updateSelectedElement({ color: e.target.value })}
                                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={selectedElement.color || '#ef4444'}
                                                    onChange={(e) => updateSelectedElement({ color: e.target.value })}
                                                    className="flex-1 px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedElement.type === 'input' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    id="hideLabel"
                                                    checked={!!selectedElement.content?.hideLabel}
                                                    onChange={(e) => updateSelectedContent({ hideLabel: e.target.checked })}
                                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="hideLabel" className="text-sm font-medium text-gray-700">Hide Label Text</label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedElement.type === 'svg' && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Shape Inputs</label>
                                        <button
                                            onClick={() => {
                                                const currentInputs = selectedElement.content.inputs || [];
                                                const newId = `${selectedElement.id}_${currentInputs.length + 1}`;
                                                updateSelectedContent({ inputs: [...currentInputs, { id: newId, relX: 50, relY: 50 }] });
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                        {(selectedElement.content.inputs || []).map((inp: any, idx: number) => (
                                            <div key={idx} className="bg-gray-50 p-2 rounded border border-gray-200 text-xs space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <input
                                                        type="text"
                                                        value={inp.id}
                                                        onChange={(e) => {
                                                            const newInputs = [...selectedElement.content.inputs];
                                                            newInputs[idx].id = e.target.value;
                                                            updateSelectedContent({ inputs: newInputs });
                                                        }}
                                                        className="font-mono text-xs w-24 border-gray-300 rounded p-1"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newInputs = selectedElement.content.inputs.filter((_: any, i: number) => i !== idx);
                                                            updateSelectedContent({ inputs: newInputs });
                                                        }}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        Drop
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 mb-2">
                                                    <div>
                                                        <span className="text-gray-500 block mb-0.5">Left (X%)</span>
                                                        <input type="number" value={inp.relX} className="w-full border-gray-300 rounded p-1" onChange={(e) => {
                                                            const newInputs = [...selectedElement.content.inputs];
                                                            newInputs[idx].relX = Number(e.target.value);
                                                            updateSelectedContent({ inputs: newInputs });
                                                        }} />
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block mb-0.5">Top (Y%)</span>
                                                        <input type="number" value={inp.relY} className="w-full border-gray-300 rounded p-1" onChange={(e) => {
                                                            const newInputs = [...selectedElement.content.inputs];
                                                            newInputs[idx].relY = Number(e.target.value);
                                                            updateSelectedContent({ inputs: newInputs });
                                                        }} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <div>
                                                        <span className="text-gray-500 block mb-0.5">Align X</span>
                                                        <select
                                                            value={inp.placeX || 'manual'}
                                                            className="w-full border-gray-300 rounded p-1 text-xs"
                                                            onChange={(e) => {
                                                                const newInputs = [...selectedElement.content.inputs];
                                                                newInputs[idx].placeX = e.target.value;
                                                                updateSelectedContent({ inputs: newInputs });
                                                            }}
                                                        >
                                                            <option value="manual">Manual (Use X%)</option>
                                                            <option value="left">Left</option>
                                                            <option value="center">Center</option>
                                                            <option value="right">Right</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block mb-0.5">Align Y</span>
                                                        <select
                                                            value={inp.placeY || 'manual'}
                                                            className="w-full border-gray-300 rounded p-1 text-xs"
                                                            onChange={(e) => {
                                                                const newInputs = [...selectedElement.content.inputs];
                                                                newInputs[idx].placeY = e.target.value;
                                                                updateSelectedContent({ inputs: newInputs });
                                                            }}
                                                        >
                                                            <option value="manual">Manual (Use Y%)</option>
                                                            <option value="top">Top</option>
                                                            <option value="center">Center</option>
                                                            <option value="bottom">Bottom</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
