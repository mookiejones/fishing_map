import { describe, it, expect } from 'vitest';
import { OYSTER_BEDS, SEAGRASS_BEDS } from '../../src/data/overlays';

describe('combined overlay data', () => {
    it('OYSTER_BEDS and SEAGRASS_BEDS have no overlapping IDs', () => {
        const oysterIds = new Set(OYSTER_BEDS.map(o => o.id));
        SEAGRASS_BEDS.forEach(o => expect(oysterIds.has(o.id)).toBe(false));
    });
});
