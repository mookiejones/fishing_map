import { describe, it, expect } from 'vitest';
import { WeatherAPI } from '../../src/api';

describe('degToCompass', () => {
    it('returns N for 0°',           () => expect(WeatherAPI.degToCompass(0)).toBe('N'));
    it('returns E for 90°',          () => expect(WeatherAPI.degToCompass(90)).toBe('E'));
    it('returns S for 180°',         () => expect(WeatherAPI.degToCompass(180)).toBe('S'));
    it('returns W for 270°',         () => expect(WeatherAPI.degToCompass(270)).toBe('W'));
    it('returns NE for 45°',         () => expect(WeatherAPI.degToCompass(45)).toBe('NE'));
    it('returns SW for 225°',        () => expect(WeatherAPI.degToCompass(225)).toBe('SW'));
    it('returns NNE for 22°',        () => expect(WeatherAPI.degToCompass(22)).toBe('NNE'));
    it('returns N for 360° (wraps)', () => expect(WeatherAPI.degToCompass(360)).toBe('N'));
});
