import React, { Component } from "react";
import { LoadScript } from "@react-google-maps/api";

const LIBRARIES = ["places"];

class GoogleMapsErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Google Maps script load issue intercepted:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.children;
    }
    return this.props.children;
  }
}

export default function SafeGoogleMapsWrapper({ children }) {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === "your_google_maps_api_key_here") {
    // If no valid key is provided, bypass LoadScript so app works seamlessly
    return <>{children}</>;
  }

  return (
    <GoogleMapsErrorBoundary>
      <LoadScript
        googleMapsApiKey={apiKey}
        libraries={LIBRARIES}
        loadingElement={<div className="hidden" />}
      >
        {children}
      </LoadScript>
    </GoogleMapsErrorBoundary>
  );
}

