import React, { useState, useEffect, useCallback } from 'react';
import { generateTripPlan, generatePlaceImage } from '../services/geminiService';
import type { TripPlan, LatLng } from '../types';
import { MapPinIcon, SparklesIcon, CompassIcon } from './icons';

const TripPlanner: React.FC = () => {
  const [source, setSource] = useState<string>('San Francisco, CA');
  const [destination, setDestination] = useState<string>('Los Angeles, CA');
  const [interests, setInterests] = useState<string>('quirky roadside attractions and unique cafes');
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn(`Could not get user location: ${error.message}`);
        }
      );
    }
  }, []);

  const handlePlanTrip = useCallback(async () => {
    if (!source || !destination || !interests) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError(null);
    setTripPlan(null);

    const generateImagesForPlan = (plan: TripPlan) => {
      plan.locations.forEach(async (location, index) => {
        setTripPlan(currentPlan => {
          if (!currentPlan) return null;
          const newLocations = [...currentPlan.locations];
          newLocations[index] = { ...newLocations[index], imageLoading: true };
          return { ...currentPlan, locations: newLocations };
        });

        try {
          const imageUrl = await generatePlaceImage(location.maps.title);
          setTripPlan(currentPlan => {
            if (!currentPlan) return null;
            const newLocations = [...currentPlan.locations];
            newLocations[index] = { ...newLocations[index], imageUrl, imageLoading: false };
            return { ...currentPlan, locations: newLocations };
          });
        } catch (error) {
          console.error(`Failed to load image for ${location.maps.title}`, error);
          setTripPlan(currentPlan => {
            if (!currentPlan) return null;
            const newLocations = [...currentPlan.locations];
            newLocations[index] = { ...newLocations[index], imageLoading: false };
            return { ...currentPlan, locations: newLocations };
          });
        }
      });
    };

    try {
      const plan = await generateTripPlan(source, destination, interests, userLocation);
      setTripPlan(plan);
      if (plan && plan.locations) {
        generateImagesForPlan(plan);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, [source, destination, interests, userLocation]);

  const renderItinerary = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <h3 key={index} className="text-xl font-bold text-cyan-400 mt-4 mb-2">{part.slice(2, -2)}</h3>;
      }
      return <p key={index} className="text-slate-300 leading-relaxed">{part}</p>;
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 mb-2">
          AI Trip Planner
        </h1>
        <p className="text-slate-400">Discover hidden gems on your next road trip with Gemini.</p>
      </header>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl shadow-slate-950/50 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-slate-400 mb-2">Source</label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="text" id="source" value={source} onChange={(e) => setSource(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" />
            </div>
          </div>
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-slate-400 mb-2">Destination</label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="text" id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" />
            </div>
          </div>
        </div>
        <div className="mb-6">
          <label htmlFor="interests" className="block text-sm font-medium text-slate-400 mb-2">I'm interested in...</label>
          <div className="relative">
            <SparklesIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input type="text" id="interests" value={interests} onChange={(e) => setInterests(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" />
          </div>
        </div>
        <button
          onClick={handlePlanTrip}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Planning your adventure...
            </>
          ) : (
             <>
              <CompassIcon className="w-5 h-5" />
              Plan My Trip
             </>
          )}
        </button>
      </div>

      {error && <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">{error}</div>}

      {tripPlan && (
        <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700">
          <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Your Itinerary</h2>
          <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-cyan-400">
            {renderItinerary(tripPlan.itinerary)}
          </div>

          {tripPlan.locations.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-700">
              <h3 className="text-xl font-semibold mb-4 text-slate-300">Suggested Stops</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tripPlan.locations.map((loc, index) => (
                   <div key={index} className="bg-slate-800/50 rounded-lg overflow-hidden shadow-lg transition-transform transform hover:-translate-y-1 border border-slate-700">
                    <div className="aspect-video bg-slate-800 flex items-center justify-center text-slate-500">
                      {loc.imageLoading && (
                        <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {loc.imageUrl && (
                        <img src={loc.imageUrl} alt={loc.maps.title} className="w-full h-full object-cover" />
                      )}
                      {!loc.imageUrl && !loc.imageLoading && (
                        <MapPinIcon className="w-10 h-10 text-slate-600"/>
                      )}
                    </div>
                    <div className="p-4">
                      <a
                        href={loc.maps.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold"
                      >
                        <MapPinIcon className="w-5 h-5 flex-shrink-0"/>
                        <span className="truncate">{loc.maps.title}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TripPlanner;
