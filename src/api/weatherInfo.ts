
import { WeatherInfo } from '../types';


function weatherInfo(code: number): WeatherInfo {
        if (code === 0)   return { icon: '☀️',  desc: 'Clear' };
        if (code <= 2)    return { icon: '⛅',  desc: 'Partly Cloudy' };
        if (code === 3)   return { icon: '☁️',  desc: 'Overcast' };
        if (code <= 48)   return { icon: '🌫️', desc: 'Foggy' };
        if (code <= 57)   return { icon: '🌦️', desc: 'Drizzle' };
        if (code <= 67)   return { icon: '🌧️', desc: 'Rain' };
        if (code <= 77)   return { icon: '❄️',  desc: 'Snow' };
        if (code <= 82)   return { icon: '🌦️', desc: 'Showers' };
        if (code <= 99)   return { icon: '⛈️',  desc: 'Thunderstorm' };
        return { icon: '🌤️', desc: 'Variable' };
    }
    export default weatherInfo;