export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface GroundingChunkMap {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  maps: GroundingChunkMap;
}

export interface LocationWithImage extends GroundingChunk {
  imageUrl?: string;
  imageLoading?: boolean;
}

export interface TripPlan {
  itinerary: string;
  locations: LocationWithImage[];
}