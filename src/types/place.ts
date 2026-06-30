export interface Place {
  id: number;
  name: string;
  location: string;
  shortDescription: string;
  longDescription: string;
  heroImage: string;
  gallery: string[];
  videoUrl: string;
  coordinates: {
    lng: number;
    lat: number;
  };
}