// Date formatter: DD/MM/YYYY
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// Indian numbering system: 1,23,456
export function formatIndianNumber(num: number): string {
    const str = num.toString();
    if (str.length <= 3) return str;

    let result = str.slice(-3);
    let remaining = str.slice(0, -3);

    while (remaining.length > 2) {
        result = remaining.slice(-2) + ',' + result;
        remaining = remaining.slice(0, -2);
    }

    if (remaining) {
        result = remaining + ',' + result;
    }

    return result;
}

// Add days to a date
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// Format date to ISO string for input[type="date"]
export function toInputDateFormat(date: Date): string {
    return date.toISOString().split('T')[0];
}

// Parse input date to Date object
export function fromInputDateFormat(dateString: string): Date {
    return new Date(dateString + 'T00:00:00');
}

// Get days remaining until due date (positive = future, negative = overdue, 0 = today)
export function getDaysRemaining(dueDate: Date | string): number {
    const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    const today = new Date();

    // Reset time to midnight for accurate day calculation
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

// Format days remaining as user-friendly text
export function formatDaysRemaining(dueDate: Date | string, isUrdu: boolean = false, status?: string): { text: string; color: string } {
    const days = getDaysRemaining(dueDate);

    // If order is completed/delivered, don't show overdue/days left
    if (status && ['completed', 'delivered'].includes(status.toLowerCase())) {
        return {
            text: '',
            color: ''
        };
    }

    if (days < 0) {
        const absDays = Math.abs(days);
        return {
            text: isUrdu ? `${absDays} دن گزر گئے` : `${absDays} day${absDays > 1 ? 's' : ''} overdue`,
            color: 'text-red-600 bg-red-50'
        };
    } else if (days === 0) {
        return {
            text: isUrdu ? 'آج' : 'Today',
            color: 'text-orange-600 bg-orange-50'
        };
    } else if (days === 1) {
        return {
            text: isUrdu ? 'کل' : 'Tomorrow',
            color: 'text-yellow-600 bg-yellow-50'
        };
    } else if (days <= 3) {
        return {
            text: isUrdu ? `${days} دن باقی` : `${days} days left`,
            color: 'text-yellow-600 bg-yellow-50'
        };
    } else {
        return {
            text: isUrdu ? `${days} دن باقی` : `${days} days left`,
            color: 'text-green-600 bg-green-50'
        };
    }
}
