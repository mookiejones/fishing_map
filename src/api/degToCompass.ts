/**
     * Converts a meteorological wind direction in degrees to a 16-point compass abbreviation.
     *
     * @param deg - Wind direction in degrees (0 = N, 90 = E, 180 = S, 270 = W).
     * @returns A compass string such as `'NE'` or `'SSW'`.
     */
    function degToCompass(deg: number): string {
        const dirs = [
            'N','NNE','NE','ENE','E','ESE','SE','SSE',
            'S','SSW','SW','WSW','W','WNW','NW','NNW',
        ] as const;
        return dirs[Math.round(deg / 22.5) % 16]!;
    }
    export default degToCompass;