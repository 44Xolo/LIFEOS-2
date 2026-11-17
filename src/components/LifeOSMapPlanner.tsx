import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  APIProvider,
  APILoadingStatus,
  AdvancedMarker,
  ColorScheme,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import type { AdvancedMarkerProps } from '@vis.gl/react-google-maps';
import {
  ArrowLeftRight,
  CalendarPlus,
  Car,
  Compass,
  ExternalLink,
  Footprints,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  TrainFront,
  Bike,
  X,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { todayIsoDate } from '../lib/formatters';

type LatLngLiteral = google.maps.LatLngLiteral;
type TravelModeKey = 'DRIVING' | 'TRANSIT' | 'WALKING' | 'BICYCLING';
type NearbyCategoryKey = 'cafe' | 'transit_station' | 'library' | 'bank';

interface SelectedPlacePoint {
  id: string;
  name: string;
  address: string;
  position: LatLngLiteral;
  categoryLabel?: string;
}

interface RouteSummary {
  distanceMeters: number;
  durationMillis: number;
}

const DEFAULT_CENTER: LatLngLiteral = { lat: -26.2041, lng: 28.0473 };

const TRAVEL_MODES: ReadonlyArray<{
  id: TravelModeKey;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'DRIVING', label: 'Drive', icon: Car },
  { id: 'TRANSIT', label: 'Transit', icon: TrainFront },
  { id: 'WALKING', label: 'Walk', icon: Footprints },
  { id: 'BICYCLING', label: 'Cycle', icon: Bike },
];

const NEARBY_CATEGORIES: ReadonlyArray<{ id: NearbyCategoryKey; label: string }> = [
  { id: 'cafe', label: 'Work Cafés' },
  { id: 'transit_station', label: 'Transit Hubs' },
  { id: 'library', label: 'Study Libraries' },
  { id: 'bank', label: 'Banks & Services' },
];

function checkQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || '');
  const upper = msg.toUpperCase();
  return (
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('OVER_QUERY_LIMIT') ||
    upper.includes('QUOTA') ||
    upper.includes('429')
  );
}

function triggerQuotaBanner() {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
}

function useAutocompleteSuggestions(inputString: string) {
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = inputString.trim();
    if (!placesLib || trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }
        setIsLoading(true);
        const res = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: trimmed,
          sessionToken: sessionTokenRef.current,
        });
        if (!cancelled) {
          setSuggestions(res.suggestions || []);
        }
      } catch (err) {
        if (checkQuotaError(err)) {
          triggerQuotaBanner();
        }
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 240);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [placesLib, inputString]);

  const resetSession = useCallback(() => {
    sessionTokenRef.current = null;
    setSuggestions([]);
  }, []);

  return { suggestions, isLoading, resetSession };
}

interface PlaceAutocompleteFieldProps {
  label: string;
  placeholder: string;
  selected: SelectedPlacePoint | null;
  onSelect: (place: SelectedPlacePoint) => void;
  onClear?: () => void;
  accentClass?: string;
}

const PlaceAutocompleteField: React.FC<PlaceAutocompleteFieldProps> = ({
  label,
  placeholder,
  selected,
  onSelect,
  onClear,
  accentClass = 'bg-fuchsia-500',
}) => {
  const placesLib = useMapsLibrary('places');
  const [queryText, setQueryText] = useState('');
  const [focused, setFocused] = useState(false);
  const { suggestions, isLoading, resetSession } = useAutocompleteSuggestions(queryText);

  useEffect(() => {
    if (selected) {
      setQueryText(selected.name);
    }
  }, [selected]);

  const handleChoose = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!placesLib || !suggestion.placePrediction) return;
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'viewport'],
      });
      if (place.location) {
        const next: SelectedPlacePoint = {
          id: place.id || `place_${Date.now()}`,
          name: place.displayName || suggestion.placePrediction.text.text,
          address: place.formattedAddress || '',
          position: {
            lat: place.location.lat(),
            lng: place.location.lng(),
          },
        };
        setQueryText(next.name);
        setFocused(false);
        onSelect(next);
      }
      resetSession();
    } catch (err) {
      if (checkQuotaError(err)) {
        triggerQuotaBanner();
      }
    }
  };

  return (
    <div className="relative space-y-1.5">
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className={`w-2 h-2 rounded-full ${accentClass}`} />
          <span>{label}</span>
        </span>
        {selected && onClear && (
          <button
            type="button"
            onClick={() => {
              setQueryText('');
              onClear();
            }}
            className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] focus-within:border-fuchsia-500 transition-colors">
        <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <input
          type="text"
          value={queryText}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 180)}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-xs sm:text-sm outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 min-w-0"
        />
        {queryText && (
          <button
            type="button"
            onClick={() => {
              setQueryText('');
              resetSession();
              onClear?.();
            }}
            className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
            aria-label={`Clear ${label}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {focused && (suggestions.length > 0 || isLoading) && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0C0C14] shadow-xl max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {isLoading && suggestions.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-zinc-500">Searching Google Places...</div>
          ) : (
            suggestions.map((s, idx) => (
              <button
                key={`${s.placePrediction?.placeId || idx}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  void handleChoose(s);
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
              >
                <div className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                  {s.placePrediction?.text.text}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

interface AdvancedMarkerWithRefProps extends AdvancedMarkerProps {
  onMarkerClick: (marker: google.maps.marker.AdvancedMarkerElement) => void;
}

const AdvancedMarkerWithRef: React.FC<AdvancedMarkerWithRefProps> = ({
  children,
  onMarkerClick,
  ...advancedMarkerProps
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  return (
    <AdvancedMarker
      ref={markerRef}
      onClick={() => {
        if (marker) {
          onMarkerClick(marker);
        }
      }}
      {...advancedMarkerProps}
    >
      {children}
    </AdvancedMarker>
  );
};

const RouteOverlayLayer: React.FC<{
  origin: SelectedPlacePoint | null;
  destination: SelectedPlacePoint | null;
  travelMode: TravelModeKey;
  onRouteSummary: (summary: RouteSummary | null) => void;
  onRouteError: (msg: string | null) => void;
}> = ({ origin, destination, travelMode, onRouteSummary, onRouteError }) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (!map || !routesLib || !origin || !destination) {
      onRouteSummary(null);
      return;
    }

    let cancelled = false;
    onRouteError(null);

    const request = {
      origin: origin.position,
      destination: destination.position,
      travelMode,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    };

    const RouteClass = routesLib.Route as unknown as {
      computeRoutes: (req: typeof request) => Promise<{
        routes?: Array<{
          createPolylines?: () => google.maps.Polyline[];
          distanceMeters?: number;
          durationMillis?: number;
          viewport?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
        }>;
      }>;
    };

    RouteClass.computeRoutes(request)
      .then((res) => {
        if (cancelled) return;
        const primaryRoute = res.routes?.[0];
        if (!primaryRoute) {
          onRouteSummary(null);
          onRouteError('No route found between the selected points for this mode.');
          return;
        }

        const created = primaryRoute.createPolylines ? primaryRoute.createPolylines() : [];
        created.forEach((line) => {
          line.setOptions({
            strokeColor: '#EC4899',
            strokeOpacity: 0.92,
            strokeWeight: 5,
          });
          line.setMap(map);
        });
        polylinesRef.current = created;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 48);
        }

        onRouteSummary({
          distanceMeters: primaryRoute.distanceMeters ?? 0,
          durationMillis: primaryRoute.durationMillis ?? 0,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (checkQuotaError(err)) {
          triggerQuotaBanner();
        }
        onRouteSummary(null);
        const msg = err instanceof Error ? err.message : 'Unable to compute route right now.';
        onRouteError(msg);
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routesLib, origin, destination, travelMode, onRouteSummary, onRouteError]);

  return null;
};

const MapInnerExperience: React.FC = () => {
  const { theme, addTask } = useLifeOS();
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const loadingStatus = useApiLoadingStatus();

  const [origin, setOrigin] = useState<SelectedPlacePoint | null>(null);
  const [destination, setDestination] = useState<SelectedPlacePoint | null>(null);
  const [travelMode, setTravelMode] = useState<TravelModeKey>('DRIVING');
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [nearbyCategory, setNearbyCategory] = useState<NearbyCategoryKey>('cafe');
  const [nearbyPlaces, setNearbyPlaces] = useState<SelectedPlacePoint[]>([]);
  const [nearbyBusy, setNearbyBusy] = useState(false);
  const [nearbyMessage, setNearbyMessage] = useState<string | null>(null);

  const [activePinData, setActivePinData] = useState<SelectedPlacePoint | null>(null);
  const [activeMarker, setActiveMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [taskSavedNotice, setTaskSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (loadingStatus === APILoadingStatus.AUTH_FAILURE) {
      triggerQuotaBanner();
    }
  }, [loadingStatus]);

  useEffect(() => {
    if (!map) return;
    if (destination) {
      map.panTo(destination.position);
      if ((map.getZoom() || 10) < 13) {
        map.setZoom(14);
      }
    } else if (origin) {
      map.panTo(origin.position);
      if ((map.getZoom() || 10) < 13) {
        map.setZoom(14);
      }
    }
  }, [map, origin, destination]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage('Browser geolocation is unavailable on this device.');
      return;
    }
    setGeoBusy(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point: SelectedPlacePoint = {
          id: 'user_gps_origin',
          name: 'My Current Location',
          address: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          position: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
        };
        setOrigin(point);
        setGeoBusy(false);
        if (map) {
          map.panTo(point.position);
          map.setZoom(14);
        }
      },
      () => {
        setGeoBusy(false);
        setGeoMessage('Location access declined. Type an origin address above instead.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleExploreNearby = async (cat: NearbyCategoryKey = nearbyCategory) => {
    if (!placesLib) return;
    const mapCenter = map?.getCenter();
    const anchorCenter: LatLngLiteral =
      destination?.position ||
      origin?.position ||
      (mapCenter ? { lat: mapCenter.lat(), lng: mapCenter.lng() } : DEFAULT_CENTER);

    setNearbyCategory(cat);
    setNearbyBusy(true);
    setNearbyMessage(null);

    try {
      const response = await placesLib.Place.searchNearby({
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'primaryTypeDisplayName'],
        locationRestriction: {
          center: anchorCenter,
          radius: 4000,
        },
        includedPrimaryTypes: [cat],
        maxResultCount: 8,
        rankPreference: placesLib.SearchNearbyRankPreference.POPULARITY,
      });

      const found: SelectedPlacePoint[] = (response.places || [])
        .filter((p) => Boolean(p.location))
        .map((p) => ({
          id: p.id || `nearby_${Math.random().toString(36).slice(2)}`,
          name: p.displayName || 'Unnamed Place',
          address: p.formattedAddress || '',
          categoryLabel: p.primaryTypeDisplayName || undefined,
          position: {
            lat: p.location!.lat(),
            lng: p.location!.lng(),
          },
        }));

      setNearbyPlaces(found);
      if (found.length === 0) {
        setNearbyMessage('No places found within 4 km for this category. Pan the map or search an address.');
      }
    } catch (err) {
      if (checkQuotaError(err)) {
        triggerQuotaBanner();
      }
      setNearbyMessage('Unable to fetch nearby places right now.');
    } finally {
      setNearbyBusy(false);
    }
  };

  const handleSwapEndpoints = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleScheduleTripTask = async (place: SelectedPlacePoint) => {
    const durationText = routeSummary ? ` (${Math.max(1, Math.round(routeSummary.durationMillis / 60000))} min)` : '';
    await addTask({
      title: `Visit ${place.name}${durationText}`,
      category: 'work',
      priority: 'medium',
      dueDate: todayIsoDate(),
    });
    setTaskSavedNotice(`Saved "${place.name}" to your Tasks & Schedule`);
    window.setTimeout(() => setTaskSavedNotice(null), 3500);
  };

  const handlePinClick = (place: SelectedPlacePoint, marker: google.maps.marker.AdvancedMarkerElement) => {
    setActivePinData(place);
    setActiveMarker(marker);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Column */}
        <div className="lg:col-span-4 space-y-5">
          {/* Route & Endpoint Card */}
          <div className="bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-fuchsia-500" />
                <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-white">
                  Route &amp; Commute Planner
                </h2>
              </div>
              {(origin || destination) && (
                <button
                  type="button"
                  onClick={handleSwapEndpoints}
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-fuchsia-500 transition-colors cursor-pointer"
                  title="Swap origin and destination"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Swap</span>
                </button>
              )}
            </div>

            <PlaceAutocompleteField
              label="Origin"
              placeholder="Search start address or office..."
              selected={origin}
              onSelect={setOrigin}
              onClear={() => setOrigin(null)}
              accentClass="bg-indigo-500"
            />

            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={geoBusy}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-fuchsia-500/40 transition-colors cursor-pointer disabled:opacity-60"
            >
              <LocateFixed className="w-3.5 h-3.5 text-indigo-500" />
              <span>{geoBusy ? 'Locating device...' : 'Use My Current Location (GPS Consent)'}</span>
            </button>

            {geoMessage && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">{geoMessage}</p>
            )}

            <PlaceAutocompleteField
              label="Destination"
              placeholder="Search meeting venue, client, or campus..."
              selected={destination}
              onSelect={setDestination}
              onClear={() => setDestination(null)}
              accentClass="bg-fuchsia-500"
            />

            {/* Travel Mode Selector */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-[#050508]">
              {TRAVEL_MODES.map((m) => {
                const Icon = m.icon;
                const active = travelMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTravelMode(m.id)}
                    className={`relative py-1.5 px-1 rounded-md text-[11px] font-medium flex flex-col items-center gap-0.5 cursor-pointer ${
                      active ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="map-travel-mode"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 lifeos-gradient-bg rounded-md"
                      />
                    )}
                    <Icon className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {routeError && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300">
                {routeError}
              </div>
            )}

            {routeSummary && destination && (
              <div className="p-4 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Distance</div>
                    <div className="font-mono text-lg font-bold tabular-nums text-zinc-900 dark:text-white">
                      {(routeSummary.distanceMeters / 1000).toFixed(1)} km
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Est. Travel Time</div>
                    <div className="font-mono text-lg font-bold tabular-nums text-fuchsia-600 dark:text-fuchsia-400">
                      {Math.max(1, Math.round(routeSummary.durationMillis / 60000))} min
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleScheduleTripTask(destination)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg lifeos-gradient-bg text-white text-xs font-semibold hover:opacity-95 transition-opacity cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Add Trip to Tasks &amp; Schedule</span>
                </button>
              </div>
            )}

            {taskSavedNotice && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {taskSavedNotice}
              </p>
            )}
          </div>

          {/* Nearby Everyday Hubs Card */}
          <div className="bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-purple-500" />
                <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-white">
                  Nearby Hubs (Places API)
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {NEARBY_CATEGORIES.map((cat) => {
                const active = nearbyCategory === cat.id && nearbyPlaces.length > 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleExploreNearby(cat.id)}
                    disabled={nearbyBusy || !placesLib}
                    className={`px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                      active
                        ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-zinc-700 dark:text-zinc-300 hover:border-fuchsia-500/40'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {nearbyBusy && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Finding nearby places...</p>
            )}

            {nearbyMessage && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{nearbyMessage}</p>
            )}

            {nearbyPlaces.length > 0 && (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 max-h-60 overflow-y-auto pr-1">
                {nearbyPlaces.map((p) => (
                  <div key={p.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActivePinData(p);
                          map?.panTo(p.position);
                          map?.setZoom(15);
                        }}
                        className="text-xs font-semibold text-zinc-900 dark:text-white hover:text-fuchsia-500 truncate block text-left w-full cursor-pointer"
                      >
                        {p.name}
                      </button>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {p.address}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDestination(p)}
                      className="text-[11px] font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:underline shrink-0 cursor-pointer"
                    >
                      Route
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Interactive Google Map Canvas (explicit height prevents collapse) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="h-[460px] sm:h-[540px] w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800/90 bg-zinc-100 dark:bg-[#0C0C14] shadow-sm">
            <GoogleMap
              mapId="DEMO_MAP_ID"
              defaultCenter={DEFAULT_CENTER}
              defaultZoom={12}
              gestureHandling="greedy"
              colorScheme={theme === 'dark' ? ColorScheme.DARK : ColorScheme.LIGHT}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              {origin && (
                <AdvancedMarkerWithRef
                  position={origin.position}
                  title={origin.name}
                  zIndex={900}
                  onMarkerClick={(marker) => handlePinClick(origin, marker)}
                >
                  <Pin background="#6366F1" borderColor="#312E81" glyphColor="#FFFFFF" />
                </AdvancedMarkerWithRef>
              )}

              {destination && (
                <AdvancedMarkerWithRef
                  position={destination.position}
                  title={destination.name}
                  zIndex={1000}
                  onMarkerClick={(marker) => handlePinClick(destination, marker)}
                >
                  <Pin background="#EC4899" borderColor="#831843" glyphColor="#FFFFFF" />
                </AdvancedMarkerWithRef>
              )}

              {nearbyPlaces.map((place, idx) => (
                <AdvancedMarkerWithRef
                  key={place.id}
                  position={place.position}
                  title={place.name}
                  zIndex={100 + idx}
                  onMarkerClick={(marker) => handlePinClick(place, marker)}
                >
                  <Pin background="#A855F7" borderColor="#581C87" glyphColor="#FFFFFF" />
                </AdvancedMarkerWithRef>
              ))}

              {activePinData && activeMarker && (
                <InfoWindow
                  anchor={activeMarker}
                  onCloseClick={() => {
                    setActivePinData(null);
                    setActiveMarker(null);
                  }}
                >
                  <div className="p-1 max-w-[230px] text-zinc-900 space-y-2">
                    <div className="text-xs font-bold leading-snug">{activePinData.name}</div>
                    {activePinData.address && (
                      <div className="text-[11px] text-zinc-600 leading-snug">{activePinData.address}</div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setDestination(activePinData)}
                        className="px-2 py-1 rounded bg-fuchsia-600 text-white text-[11px] font-medium cursor-pointer"
                      >
                        Set Destination
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScheduleTripTask(activePinData)}
                        className="px-2 py-1 rounded bg-zinc-900 text-white text-[11px] font-medium cursor-pointer"
                      >
                        Add Task
                      </button>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${activePinData.position.lat},${activePinData.position.lng}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline"
                      >
                        <span>Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </InfoWindow>
              )}

              <RouteOverlayLayer
                origin={origin}
                destination={destination}
                travelMode={travelMode}
                onRouteSummary={setRouteSummary}
                onRouteError={setRouteError}
              />
            </GoogleMap>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
            <span>
              Interactive routing uses Google Maps Routes API &amp; Places API (New). Device GPS is only requested when clicked.
            </span>
            <span className="inline-flex items-center gap-3 font-mono">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Origin
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-fuchsia-500" /> Destination
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> Nearby Hub
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LifeOSMapPlanner: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(() => import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
  const [resolving, setResolving] = useState<boolean>(() => !import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    if (apiKey) return;
    let active = true;
    fetch('/api/config/maps')
      .then((res) => (res.ok ? res.json() : { apiKey: '' }))
      .then((data: { apiKey?: string }) => {
        if (active && data.apiKey) {
          setApiKey(data.apiKey);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setResolving(false);
      });
    return () => {
      active = false;
    };
  }, [apiKey]);

  if (resolving) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#0C0C14] p-12 text-center space-y-2">
        <MapPin className="w-6 h-6 text-fuchsia-500 mx-auto" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Initializing Google Maps workspace...</p>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#0C0C14] p-8 text-center space-y-2">
        <MapPin className="w-6 h-6 text-fuchsia-500 mx-auto" />
        <h3 className="font-display text-base font-semibold text-zinc-900 dark:text-white">
          Google Maps Key Pending Configuration
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          Configure <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code> in your AI Studio environment secrets or Google Maps Settings panel, then refresh the preview.
        </p>
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={apiKey}
      libraries={['places', 'routes', 'marker']}
      language="en"
      region="ZA"
    >
      <MapInnerExperience />
    </APIProvider>
  );
};
