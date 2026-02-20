import { useAppContext } from "../context/AppContext";

import { APIProvider } from "@vis.gl/react-google-maps";
import { MapInner } from "../components/FishingMap";
import SetupBanner from "../components/SetupBannerComponent";

const PLACEHOLDER_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

/**
 * Container that guards map rendering behind API key availability.
 * Shows `<SetupBanner>` when no valid key is set; otherwise wraps `<MapInner>` in `<APIProvider>`.
 */
function FishingMapContainer() {

     const { apiKey, saveApiKey } = useAppContext();
    
        if (!apiKey || apiKey === PLACEHOLDER_KEY) {
            return <SetupBanner onSave={saveApiKey} />;
        }
    
    return (
        <APIProvider apiKey={apiKey}>
            <MapInner/>
        </APIProvider>
    );
}

export default FishingMapContainer;