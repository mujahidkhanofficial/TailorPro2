import { Customer, CustomerMeasurement, Settings, Order, Worker } from '@/db/database';
import { designOptions, collarNokOptions, banPattiOptions, cuffOptions, frontPocketOptions, sidePocketOptions, frontStripOptions, hemStyleOptions, shalwarFarmaishOptions } from '@/db/templates';
import { formatDate } from '@/utils/formatters';
import { formatMeasurementDisplay } from '@/utils/fractionUtils';

export const generateMeasurementSlipHTML = (
    customer: Customer,
    measurement: CustomerMeasurement,
    settings?: Settings,
    workerNames?: { cutter?: string; checker?: string; karigar?: string },
    order?: Order
): string => {

    const shopName = settings?.shopName || 'M.R.S Fabrics & Tailors';
    const address = settings?.address || 'Gul Plaza Wapda Town Main Market Taru Jabba';
    const phones = [settings?.phone1, settings?.phone2].filter(Boolean).join(' | ') || '0313-9003733';

    // Helper to get option label
    const getOptionLabel = (options: any[], value: string) => {
        return options.find(o => o.value === value)?.labelUr || '';
    };

    // Workers
    const cutterName = workerNames?.cutter || '________';
    const checkerName = workerNames?.checker || '________';
    const karigarName = workerNames?.karigar || '________';

    // Build measurement rows (Right Column - Primary Measurements)
    // Unified Field Order (Matching CustomerMeasurementForm.tsx)
    const fieldOrder = [
        { key: 'length', label: 'لمبائی', type: 'meas' },
        { key: 'sleeve', label: 'آستین', type: 'meas' },
        { key: 'bazu_center', label: 'بازو سینٹر', type: 'meas' },
        { key: 'chest', label: 'چھاتی', type: 'meas' },
        { key: 'tera', label: 'تیرا', type: 'meas' },
        { key: 'kalar', label: 'کالر', type: 'meas' },
        { key: 'daaman', label: 'دامن سائز', type: 'meas' },
        { key: 'golBazu', label: 'گول بازو', type: 'meas' },
        { key: 'collarNok', label: 'کالر نوک', type: 'opt', options: collarNokOptions },
        { key: 'banPatti', label: 'بین پٹی', type: 'opt', options: banPattiOptions },
        { key: 'pattiSize', label: 'پٹی سائز', type: 'meas' },
        { key: 'cuff', label: 'کف', type: 'opt', options: cuffOptions },
        { key: 'cuffSize', label: 'کف سائز', type: 'meas' },
        { key: 'frontPocket', label: 'سامنے جیب', type: 'opt', options: frontPocketOptions },
        { key: 'sidePocket', label: 'سائیڈ جیب', type: 'opt', options: sidePocketOptions },
        { key: 'frontStrip', label: 'سامنے کی پٹی', type: 'opt', options: frontStripOptions },
        { key: 'hemStyle', label: 'دامن فرمائش', type: 'opt', options: hemStyleOptions },
        { key: 'shalwar', label: 'شلوار', type: 'meas' },
        { key: 'aasan', label: 'آسن', type: 'meas' },
        { key: 'pancha', label: 'پانچہ', type: 'meas' },
        { key: 'shalwarFarmaish', label: 'شلوار فرمائش', type: 'opt', options: shalwarFarmaishOptions },
        { key: 'shalwarWidth', label: 'شلوار چوڑائی', type: 'meas' },
    ];

    // Build unified list of visible rows
    const allRows = fieldOrder.map(field => {
        let value = '';
        let className = 'num'; // Default to numeric style (LTR)

        if (field.type === 'opt') {
            value = getOptionLabel(field.options || [], measurement.fields[field.key] || '');
            className = 'val'; // Text style (RTL)
        } else {
            value = formatMeasurementDisplay(measurement.fields[field.key] || '');
        }

        if (!value || value.trim() === '') return null;

        return { label: field.label, value, className };
    }).filter((row): row is { label: string; value: string; className: string } => row !== null);

    // Generate table rows (2 columns per row)
    let tableBodyHTML = '';
    for (let i = 0; i < allRows.length; i += 2) {
        const item1 = allRows[i];
        const item2 = allRows[i + 1];

        tableBodyHTML += `
            <tr>
                <td class="lbl">${item1.label}</td>
                <td class="${item1.className}">${item1.value}</td>
                
                ${item2 ? `
                    <td class="lbl">${item2.label}</td>
                    <td class="${item2.className}">${item2.value}</td>
                ` : `
                    <td></td><td></td>
                `}
            </tr>
        `;
    }

    // Farmaish
    const selectedFarmaish = designOptions.filter(opt => measurement.designOptions[opt.key]).map(opt => opt.labelUr);
    const farmaishText = selectedFarmaish.length > 0 ? selectedFarmaish.join('، ') : 'کوئی نہیں';

    return `
<!DOCTYPE html>
<html lang="ur">
<head>
    <meta charset="UTF-8">
    <title>Order Slip - ${customer.name}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        /* Reset */
        *, *::before, *::after {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        /* Base */
        body {
            font-family: 'Noto Nastaliq Urdu', serif;
            font-size: 15px;
            background: #ccc;
            color: #000;
            line-height: 1.5;
            direction: rtl;
        }

        /* Page Container - A5 Portrait */
        .slip {
            width: 148mm;
            min-height: 210mm;
            margin: 10mm auto;
            padding: 10mm 8mm;
            background: #fff;
            border: 3px dashed #c00;
            position: relative;
        }

        @page {
            size: A5 portrait;
            margin: 0;
        }

        @media print {
            body { 
                background: #fff; 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .slip {
                width: 100%;
                min-height: auto;
                margin: 0;
                padding: 6mm 5mm;
                border: none; /* No border in PDF */
            }
            .action-bar {
                display: none !important;
            }
        }

        /* Action Bar at Bottom */
        .action-bar {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #fff;
            padding: 12px 25px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
            display: flex;
            gap: 20px;
            z-index: 9999;
        }

        /* 3D Button Style */
        .btn-3d {
            border: 1px solid rgba(0,0,0,0.1);
            border-bottom-width: 4px;
            padding: 10px 24px;
            border-radius: 10px;
            cursor: pointer;
            font-family: inherit;
            font-weight: 700;
            font-size: 15px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.1s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .btn-3d:active {
            border-bottom-width: 1px;
            transform: translateY(3px);
            margin-top: 3px;
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);
        }

        .btn-3d.primary {
            background: #0ea5e9;
            color: white;
            border-color: #0284c7;
            border-bottom-color: #0369a1;
            text-shadow: 0 1px 1px rgba(0,0,0,0.2);
        }
        
        .btn-3d.primary:hover {
            background: #0284c7;
        }

        .btn-3d.danger {
            background: #ef4444;
            color: white;
            border-color: #dc2626;
            border-bottom-color: #b91c1c;
            text-shadow: 0 1px 1px rgba(0,0,0,0.2);
        }
        
        .btn-3d.danger:hover {
            background: #dc2626;
        }

        /* Adjust slip margin to account for bottom bar */
        body {
            padding-bottom: 100px;
        }

        /* ============ HEADER ============ */
        .header {
            text-align: center;
            margin-bottom: 2px;
            padding-bottom: 4px;
            border-bottom: 1px dashed #999; /* Dashed line separator below header */
        }

        .shop-name {
            font-size: 32px; /* Increased size */
            font-weight: 700;
            line-height: 1.1;
            margin-bottom: 2px;
            color: #000;
        }

        .shop-address {
            font-size: 14px;
            color: #444;
            margin-top: 0;
            line-height: 1.2;
            font-weight: 500;
        }

        .shop-phone {
            font-size: 16px;
            font-weight: 700;
            margin-top: 2px;
            direction: ltr;
            display: inline-block;
            margin-bottom: 4px;
        }

        /* ============ INFO GRID ============ */
        .info-section {
            border-bottom: 1px dashed #999;
            margin: 8px 0;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px dashed #ccc;
        }

        .info-row:last-child {
            border-bottom: none;
        }

        .info-cell {
            flex: 1;
            font-size: 14px;
            font-weight: 600;
        }

        .info-cell:first-child { text-align: right; }
        .info-cell:nth-child(2) { text-align: center; }
        .info-cell:last-child { text-align: left; }

        /* ============ MEASUREMENTS TABLE ============ */
        .measurements-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 15px;
        }

        .measurements-table td {
            padding: 4px 6px;
            vertical-align: middle;
        }

        /* Label columns - right aligned, bold */
        .measurements-table .lbl {
            text-align: right;
            color: #333;
            font-weight: 700;
            width: 15%; /* Reduced width to bring value closer */
            white-space: nowrap;
            padding-right: 5px;
        }

        /* Value columns for numbers - bold, larger */
        .measurements-table .num {
            text-align: right; /* Changed to right align to stick to label */
            font-weight: 700;
            font-size: 18px;
            width: 35%; /* Increased width to push next column away */
            direction: ltr; /* Keeps numbers LTR but aligns right in RTL context */
            padding-right: 10px;
        }

        /* Value columns for text options - right aligned */
        .measurements-table .val {
            text-align: right;
            font-weight: 600;
            width: 35%;
            padding-right: 10px;
        }

        /* Alternate row shading for readability */
        .measurements-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        /* ============ FARMAISH SECTION ============ */
        .farmaish-section {
            margin-top: 15px;
            padding-top: 8px;
            padding-bottom: 8px;
            border-top: 1px dashed #999;
            border-bottom: 1px dashed #999;
        }

        .farmaish-label {
            font-weight: 700;
            font-size: 14px;
        }

        .farmaish-value {
            font-size: 15px;
            font-weight: 600;
        }

        /* ============ FOOTER / ADVANCE ============ */
        .footer-section {
            margin-top: 12px;
            padding-top: 10px;
            text-align: left;
        }

        .advance-label {
            font-size: 16px;
            font-weight: 700;
        }

        .advance-amount {
            font-size: 22px;
            font-weight: 700;
        }

        .notes {
            margin-top: 5px;
            font-size: 13px;
            color: #555;
        }

    </style>
</head>
<body>

<div class="action-bar">
    <button onclick="window.opener.postMessage('save-pdf-request', '*')" class="btn-3d primary">
        <span>💾 Save PDF</span>
    </button>
    <button onclick="window.close()" class="btn-3d danger">
        <span>✖ Close</span>
    </button>
</div>

<div class="slip">

    <!-- HEADER -->
    <div class="header">
        <div class="shop-name">${shopName}</div>
        <div class="shop-address">${address}</div>
        <div class="shop-phone">${phones}</div>
    </div>

    <!-- INFO GRID -->
    <div class="info-section">
        ${order ? `
        <div class="info-row">
            <div class="info-cell">آرڈر نمبر: ${order.id}</div>
            <div class="info-cell">بلنگ: ${formatDate(order.createdAt)}</div>
            <div class="info-cell">ادائیگی: ${formatDate(order.dueDate)}</div>
        </div>
        ` : ''}
        <div class="info-row">
            <div class="info-cell">نام: ${customer.name}</div>
            <div class="info-cell">فون: ${customer.phone}</div>
            <div class="info-cell">S.No: ${customer.id}</div>
        </div>
        ${order ? `
        <div class="info-row">
            <div class="info-cell">کٹر: ${cutterName}</div>
            <div class="info-cell">چیکر: ${checkerName}</div>
            <div class="info-cell">کاریگر: ${karigarName}</div>
        </div>
        ` : ''}
    </div>

    <!-- MEASUREMENTS TABLE -->
    <table class="measurements-table">
        <tbody>
            ${tableBodyHTML}
        </tbody>
    </table>

    <!-- FARMAISH -->
    <div class="farmaish-section">
        <span class="farmaish-label">فرمائش:</span>
        <span class="farmaish-value">${farmaishText}</span>
    </div>

    <!-- FOOTER / ADVANCE -->
    ${order ? `
    <div class="footer-section">
        <span class="advance-label">پیشگی رقم:</span>
        <span class="advance-amount">${order.advancePayment || '0'}</span>
        ${order.deliveryNotes ? `<div class="notes">نوٹس: ${order.deliveryNotes}</div>` : ''}
    </div>
    ` : ''}

</div>
</body>
</html>
    `;
};

export const generateKarigarReportHTML = (
    worker: Worker,
    orders: (Order & { customerName: string, designSpecsEn: string[], designSpecsUr: string[] })[],
    dateRange: { start: Date; end: Date }
): string => {

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    // Calculate suit counts per customer
    const customerCounts: Record<string, number> = {};
    orders.forEach(o => {
        customerCounts[o.customerName] = (customerCounts[o.customerName] || 0) + 1;
    });

    let tableRows = '';
    orders.forEach(order => {
        // Use Urdu specs if available
        const specsToUse = order.designSpecsUr && order.designSpecsUr.length > 0
            ? order.designSpecsUr
            : order.designSpecsEn; // Fallback

        const specs = specsToUse.length > 0
            ? specsToUse.join('، ')
            : '-';

        // Translate status
        const statusMap: Record<string, string> = {
            'new': 'نیا',
            'in_progress': 'جاری ہے',
            'ready': 'تیار',
            'delivered': 'پہنچا',
            'completed': 'مکمل'
        };
        const statusUr = statusMap[order.status] || order.status;

        // Count for this customer
        // Use suit count from order, default to 1
        const count = order.suitsCount || 1;

        tableRows += `
            <tr>
                <td style="text-align: center;">${formatDate(order.createdAt)}</td>
                <td style="text-align: center;">${order.id}</td>
                <td>
                    <div style="font-weight: bold;">${order.customerName}</div>
                </td>
                <td style="text-align: center; font-weight: bold;">${count}</td>
                <td>${specs}</td>
                <td style="text-align: center;">
                    <span class="status-badge ${order.status}">${statusUr}</span>
                </td>
            </tr>
        `;
    });

    const totalSuits = orders.reduce((sum, o) => sum + (o.suitsCount || 1), 0);

    return `
<!DOCTYPE html>
<html lang="ur">
<head>
    <meta charset="UTF-8">
    <title>Karigar Report - ${worker.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Noto Nastaliq Urdu', serif;
            direction: rtl;
            background: #fff;
            padding: 10px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        .shop-name { font-size: 24px; font-weight: bold; margin-bottom: 2px; }
        .shop-info { font-size: 12px; color: #555; }
        
        .report-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            background: #f0f0f0;
            padding: 5px;
            border-radius: 6px;
        }

        .meta-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
            font-weight: 600;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px; /* Dense font */
        }
        
        th, td {
            border: 1px solid #ccc;
            padding: 4px; /* Dense padding */
            vertical-align: middle;
        }

        th {
            background: #f9f9f9;
            font-weight: bold;
            font-size: 13px;
        }

        .footer {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            padding-top: 10px;
            border-top: 1px dashed #ccc;
            font-size: 14px;
        }

        .status-badge {
            font-size: 11px;
            padding: 1px 5px;
            border-radius: 4px;
        }
        .status-badge.completed { background: #dcfce7; color: #166534; }
        .status-badge.delivered { background: #f3f4f6; color: #374151; }
        .status-badge.new { background: #dbeafe; color: #1e40af; }
        .status-badge.in_progress { background: #fef9c3; color: #854d0e; }

        .action-bar {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #fff;
            padding: 12px 25px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
            display: flex;
            gap: 20px;
            z-index: 9999;
        }

        .btn-3d {
            border: 1px solid rgba(0,0,0,0.1);
            border-bottom-width: 4px;
            padding: 10px 24px;
            border-radius: 10px;
            cursor: pointer;
            font-family: inherit;
            font-weight: 700;
            font-size: 15px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.1s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .btn-3d:active {
            border-bottom-width: 1px;
            transform: translateY(3px);
            margin-top: 3px;
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);
        }

        .btn-3d.primary {
            background: #0ea5e9;
            color: white;
            border-color: #0284c7;
            border-bottom-color: #0369a1;
            text-shadow: 0 1px 1px rgba(0,0,0,0.2);
        }
        
        .btn-3d.primary:hover {
            background: #0284c7;
        }

        .btn-3d.danger {
            background: #ef4444;
            color: white;
            border-color: #dc2626;
            border-bottom-color: #b91c1c;
            text-shadow: 0 1px 1px rgba(0,0,0,0.2);
        }
        
        .btn-3d.danger:hover {
            background: #dc2626;
        }

        /* Page Container - A5 Portrait */
        .slip {
            width: 148mm;
            min-height: 210mm;
            margin: 10mm auto;
            padding: 8mm 6mm; /* Slightly tighter padding for A5 */
            background: #fff;
            border: 3px dashed #c00; /* Red Border for Preview */
            position: relative;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }

        @page {
            size: A5 portrait; /* Explicit A5 */
            margin: 0;
        }

        @media print {
            body { 
                background: #fff; 
                margin: 0;
            }
            .slip {
                width: 100%;
                min-height: auto;
                margin: 0;
                padding: 10mm;
                border: none; /* No border in PDF */
                box-shadow: none;
            }
            .action-bar { display: none !important; }
        }
    </style>
</head>
<body>

    <div class="action-bar">
        <button onclick="window.print()" class="btn-3d primary">
            <span>Print Report</span>
        </button>
        <button onclick="window.close()" class="btn-3d danger">
            <span>Close</span>
        </button>
    </div>

    <div class="slip">

        <div class="report-title">
            کاریگر ہفتہ وار رپورٹ
        </div>

        <div class="meta-info">
            <div>کاریگر کا نام: <span style="font-size: 16px; color: #0284c7;">${worker.name}</span></div>
            <div style="direction: ltr;">
                ${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th width="12%">تاریخ</th>
                    <th width="8%">آرڈر #</th>
                    <th width="20%">کسٹمر</th>
                    <th width="8%">کل سوٹ</th>
                    <th width="37%">ڈیزائن / فرمائش</th>
                    <th width="15%">اسٹیٹس</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>

        <div style="margin-top: 15px; text-align: left; font-weight: bold; font-size: 15px;">
            ٹوٹل جوڑے: ${totalSuits}
        </div>

        <div class="footer">
            <div>دستخط کاریگر: _________________</div>
            <div>دستخط منیجر: _________________</div>
        </div>
    
    </div>

</body>
</html>
    `;
};
