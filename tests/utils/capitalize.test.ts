import { describe, it, expect } from 'vitest';
import { capitalize } from '../../src/utils';

describe('capitalize', () => {
    it('capitalizes species names', () => {
        expect(capitalize('tarpon')).toBe('Tarpon');
        expect(capitalize('snook')).toBe('Snook');
        expect(capitalize('redfish')).toBe('Redfish');
    });

    it('only uppercases the first letter, leaves rest unchanged', () => {
        expect(capitalize('hello world')).toBe('Hello world');
        expect(capitalize('camelCase')).toBe('CamelCase');
    });

    it('handles single character', () => {
        expect(capitalize('a')).toBe('A');
    });

    it('handles already-capitalized string', () => {
        expect(capitalize('Tarpon')).toBe('Tarpon');
    });

    it('handles empty string without throwing', () => {
        expect(capitalize('')).toBe('');
    });
});
