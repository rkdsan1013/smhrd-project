// backend/src/models/travelModel.js
class TravelDestination {
    constructor({ travel_rank, destination_name, location_address, trending_tags }) {
      this.travelRank = travel_rank;
      this.destinationName = destination_name;
      this.locationAddress = location_address;
      this.trendingTags = trending_tags || "키워드 없음";
    }
  
    static fromDb(row) {
      return new TravelDestination(row);
    }
  }
  
  module.exports = TravelDestination;