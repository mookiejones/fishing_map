import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import attachWindOverlay from '../wind/attachWindOverlay';
import type { WindOverlayController } from '../wind/attachWindOverlay';
import type { WindField } from '../wind/types';

interface Props {
    field:     WindField | null;
    timeIndex: number;
}

/**
 * Mounts the wind canvases on the map. Renders nothing of its own;
 * the legend and time slider live outside the map so they stay clickable.
 */
export default function WindOverlayComponent({ field, timeIndex }: Props) {
    const map = useMap();
    const controllerRef = useRef<WindOverlayController | null>(null);

    useEffect(() => {
        if (!map) return;
        const controller = attachWindOverlay(map);
        controllerRef.current = controller;
        controller.setFrame(field, timeIndex);
        return () => {
            controller.destroy();
            controllerRef.current = null;
        };
        // The frame effect below keeps the controller current after mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    useEffect(() => {
        controllerRef.current?.setFrame(field, timeIndex);
    }, [field, timeIndex]);

    return null;
}
