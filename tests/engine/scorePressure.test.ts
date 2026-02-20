import { describe, it, expect } from 'vitest';
import { FishingEngine } from '../../src/engine';

describe('FishingEngine.scorePressure', () => {
    it('caps at 25 maximum (high pressure + rising)', () => {
        expect(FishingEngine.scorePressure(1023, 'rising')).toBe(25);  // 21 + 4
        expect(FishingEngine.scorePressure(1030, 'rising')).toBe(25);
    });

    it('applies +1 trend bonus for stable pressure', () => {
        expect(FishingEngine.scorePressure(1030, 'stable')).toBe(22);  // 21 + 1
    });

    it('applies −6 penalty for falling barometer', () => {
        expect(FishingEngine.scorePressure(1023, 'falling')).toBe(15); // 21 − 6
        expect(FishingEngine.scorePressure(1015, 'falling')).toBe(11); // 17 − 6
    });

    it('never returns a negative value', () => {
        expect(FishingEngine.scorePressure(990, 'falling')).toBe(0);   // 2 − 6 → 0
        expect(FishingEngine.scorePressure(980, 'falling')).toBe(0);
    });

    it('scores lower pressure bands correctly', () => {
        expect(FishingEngine.scorePressure(1015, 'stable')).toBe(18);  // 17 + 1 (≥1015 band)
        expect(FishingEngine.scorePressure(1014, 'stable')).toBe(12);  // 11 + 1 (≥1008 band)
        expect(FishingEngine.scorePressure(1007, 'stable')).toBe(7);   //  6 + 1 (≥1000 band)
        expect(FishingEngine.scorePressure(999,  'stable')).toBe(3);   //  2 + 1 (< 1000 band)
    });
});
