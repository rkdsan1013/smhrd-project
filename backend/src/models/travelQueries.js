// backend/src/models/travelQueries.js
const getAllTravelDestinations = `
  SELECT travel_rank, destination_name, location_address, trending_tags 
  FROM popular_travel_destinations 
  ORDER BY travel_rank ASC
`;

module.exports = {
  getAllTravelDestinations,
};