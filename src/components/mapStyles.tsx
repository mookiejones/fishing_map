const MAP_STYLES: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry',           stylers: [{ color: '#0a1628' }] },
    { elementType: 'labels.text.fill',   stylers: [{ color: '#7aaac8' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#071220' }] },
    { featureType: 'water',   elementType: 'geometry', stylers: [{ color: '#071e33' }] },
    { featureType: 'road',    elementType: 'geometry', stylers: [{ color: '#1a3550' }] },
    { featureType: 'poi',     stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
];


export default MAP_STYLES;