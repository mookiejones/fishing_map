/** Flat index of one grid cell inside a `WindField` component array. */
export default function windCellIndex(
    nLat: number,
    nLng: number,
    timeIndex: number,
    iy: number,
    ix: number,
): number {
    return (timeIndex * nLat + iy) * nLng + ix;
}
