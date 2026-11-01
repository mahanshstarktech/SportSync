import usePlacesAutocomplete, {
  getGeocode,
  getLatLng
} from "use-places-autocomplete";

function LocationSearchInput({ onSelect }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions
  } = usePlacesAutocomplete({
    debounce: 300,
    requestOptions: {
      // Bias results towards India — optional, remove if not needed
      componentRestrictions: { country: "in" }
    }
  });

  const handleSelect = async (suggestion) => {
    setValue(suggestion.description, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address: suggestion.description });
      const { lat, lng } = await getLatLng(results[0]);

      // Pass name, lat, lng back to parent
      onSelect({
        name: suggestion.description,
        lat,
        lng
      });
    } catch (err) {
      console.error("Geocode error:", err);
    }
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        placeholder="Search location (e.g. Wankhede Stadium)"
        className="w-full border p-2 mb-1 rounded focus:outline-none focus:border-blue-400"
      />

      {/* Suggestions dropdown */}
      {status === "OK" && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {data.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-0"
            >
              <span className="font-medium">
                {suggestion.structured_formatting.main_text}
              </span>
              <span className="text-gray-400 ml-1 text-xs">
                {suggestion.structured_formatting.secondary_text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LocationSearchInput;
