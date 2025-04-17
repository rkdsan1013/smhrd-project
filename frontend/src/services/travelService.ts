// frontend/src/services/travelService.ts

import { get } from "./apiClient";

export interface TravelDestination {
  travelRank: number;
  destinationName: string;
  locationAddress: string;
  trendingTags: string;
}

const fetchTravelDestinations = async (): Promise<TravelDestination[]> => {
  try {
    console.log("Fetching travel destinations from API...");
    const data = await get<TravelDestination[]>("/popular-travel-destinations");
    console.log("Data fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("Error fetching travel destinations:", error);
    throw error;
  }
};

export default {
  fetchTravelDestinations,
};
