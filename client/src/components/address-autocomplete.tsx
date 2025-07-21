import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  required?: boolean;
}

interface AddressSuggestion {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter your address",
  label = "Address",
  className = "",
  required = false
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Load Google Maps script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.log('Google Maps API key not found - using basic address input');
      return;
    }

    console.log('Loading Google Maps API...');

    if ((window as any).google?.maps?.places) {
      console.log('Google Maps API already loaded');
      setGoogleMapsLoaded(true);
      try {
        autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
        console.log('AutocompleteService initialized successfully');
      } catch (error) {
        console.error('Error initializing AutocompleteService:', error);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    
    // Add global callback
    (window as any).initGoogleMaps = () => {
      console.log('Google Maps callback executed');
      setGoogleMapsLoaded(true);
      try {
        autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
        console.log('AutocompleteService initialized successfully');
      } catch (error) {
        console.error('Error initializing AutocompleteService:', error);
      }
    };

    script.onerror = (error) => {
      console.error('Failed to load Google Maps script:', error);
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      delete (window as any).initGoogleMaps;
    };
  }, []);

  // Handle input changes with debouncing
  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    
    if (!googleMapsLoaded || !autocompleteService.current || inputValue.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setIsLoading(true);
      console.log('Making autocomplete request for:', inputValue);
      
      const request = {
        input: inputValue,
        componentRestrictions: { country: 'us' },
        types: ['address']
      };

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('Autocomplete request timed out');
        setIsLoading(false);
        setSuggestions([]);
        setShowSuggestions(false);
      }, 5000); // 5 second timeout

      try {
        autocompleteService.current!.getPlacePredictions(request, (predictions: any, status: any) => {
          clearTimeout(timeoutId);
          console.log('Autocomplete response:', { status, predictions });
          setIsLoading(false);
          
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
            console.log('Showing suggestions:', predictions.length);
            setSuggestions(predictions.slice(0, 5)); // Limit to 5 suggestions
            setShowSuggestions(true);
          } else {
            console.log('No suggestions or error:', status);
            setSuggestions([]);
            setShowSuggestions(false);
          }
        });
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error making autocomplete request:', error);
        setIsLoading(false);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
    setIsLoading(false);
    inputRef.current?.blur();
  };

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor="address-input">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            id="address-input"
            type="text"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-10"
            autoComplete="street-address"
            required={required}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id || index}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none transition-colors"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    {suggestion.structured_formatting ? (
                      <>
                        <div className="font-medium text-sm truncate">
                          {suggestion.structured_formatting.main_text}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {suggestion.structured_formatting.secondary_text}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm">{suggestion.description}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Fallback suggestions when Google API isn't working */}
        {(!googleMapsLoaded || (!showSuggestions && value.length > 2 && !isLoading)) && value.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="px-4 py-2 text-xs text-muted-foreground border-b">
              {!googleMapsLoaded ? 'Manual entry - Common Philadelphia locations:' : 'Quick suggestions:'}
            </div>
            {[
              "1300 W Girard Ave, Philadelphia, PA 19123",
              "1500 Spring Garden St, Philadelphia, PA 19130", 
              "2000 Pennsylvania Ave, Philadelphia, PA 19130",
              "1800 JFK Blvd, Philadelphia, PA 19103",
              "1200 Market St, Philadelphia, PA 19107"
            ].filter(addr => 
              addr.toLowerCase().includes(value.toLowerCase()) || 
              value.toLowerCase().split(' ').some(word => word.length > 2 && addr.toLowerCase().includes(word))
            ).slice(0, 3).map((address, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none transition-colors"
                onClick={() => handleSuggestionSelect({ description: address, place_id: `fallback-${index}` })}
              >
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm">{address}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Type declarations for Google Maps (simplified)
declare global {
  interface Window {
    google: any;
  }
}