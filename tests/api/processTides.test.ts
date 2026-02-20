import { describe, it, expect } from 'vitest';
import { WeatherAPI } from '../../src/api';
import type { NoaaPrediction } from '../../src/types';

const predictions: NoaaPrediction[] = [
    { t: '2024-06-15 06:30', v: '1.2',  type: 'H' },
    { t: '2024-06-15 12:45', v: '-0.1', type: 'L' },
    { t: '2024-06-16 07:00', v: '1.0',  type: 'H' },
    { t: '2024-06-16 13:15', v: '0.0',  type: 'L' },
];

describe('processTides', () => {
    it('groups predictions by date', () => {
        const result = WeatherAPI.processTides(predictions);
        expect(Object.keys(result)).toEqual(
            expect.arrayContaining(['2024-06-15', '2024-06-16']),
        );
        expect(result['2024-06-15']).toHaveLength(2);
        expect(result['2024-06-16']).toHaveLength(2);
    });

    it('parses hour and minute correctly', () => {
        const first = WeatherAPI.processTides(predictions)['2024-06-15']![0]!;
        expect(first.hour).toBe(6);
        expect(first.minute).toBe(30);
    });

    it('parses height as a float', () => {
        expect(WeatherAPI.processTides(predictions)['2024-06-15']![1]!.height).toBeCloseTo(-0.1);
    });

    it('passes through tide type (H or L)', () => {
        const result = WeatherAPI.processTides(predictions);
        expect(result['2024-06-15']![0]!.type).toBe('H');
        expect(result['2024-06-15']![1]!.type).toBe('L');
    });

    it('handles single-date predictions', () => {
        const single: NoaaPrediction[] = [
            { t: '2024-06-15 00:00', v: '1.5', type: 'H' },
        ];
        const result = WeatherAPI.processTides(single);
        expect(Object.keys(result)).toHaveLength(1);
        expect(result['2024-06-15']![0]!.hour).toBe(0);
        expect(result['2024-06-15']![0]!.minute).toBe(0);
    });
});
