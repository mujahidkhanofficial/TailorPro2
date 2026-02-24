import { useState, useEffect, useRef } from 'react';

export function useAutosave<T>(value: T, onSave: (val: T) => Promise<void>, delay = 1000) {
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const firstRender = useRef(true);
    const lastSavedValue = useRef<string>(JSON.stringify(value));

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        const valueString = JSON.stringify(value);
        if (valueString === lastSavedValue.current) {
            return;
        }

        setStatus('saving');

        const handler = setTimeout(async () => {
            try {
                await onSave(value);
                lastSavedValue.current = valueString;
                setStatus('saved');

                // Reset back to idle after showing "Saved" for a bit
                setTimeout(() => setStatus('idle'), 2000);
            } catch (error) {
                console.error('Autosave error:', error);
                setStatus('error');
            }
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay, onSave]);

    return status;
}
