// International city seed database for programmatic SEO pages
// NO Greek cities — international markets only

export interface CityData {
  city: string;
  citySlug: string;
  country: string;
  countrySlug: string;
  continent: string;
  roomCount: number;
  themes: string[];
  avgDifficulty: number; // 1-5
  avgPrice: string;
  currency: string;
  avgGroupSize: string;
  avgDuration: string;
  avgRating: number;
  nearestCities: string[]; // citySlug references
  landmarks: string[];
  language: string;
  timezone: string;
  lat: number;
  lng: number;
}

export const CITIES: CityData[] = [
  // ── United Kingdom ──
  {
    city: 'London', citySlug: 'london', country: 'United Kingdom', countrySlug: 'united-kingdom',
    continent: 'Europe', roomCount: 120, themes: ['Horror', 'Mystery', 'Sci-Fi', 'Adventure', 'Fantasy'],
    avgDifficulty: 3.4, avgPrice: '£25–£35', currency: 'GBP', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.5, nearestCities: ['manchester', 'birmingham', 'bristol', 'cambridge'],
    landmarks: ['Tower of London', 'Big Ben', 'Camden Town', 'Shoreditch'],
    language: 'en', timezone: 'Europe/London', lat: 51.5074, lng: -0.1278,
  },
  {
    city: 'Manchester', citySlug: 'manchester', country: 'United Kingdom', countrySlug: 'united-kingdom',
    continent: 'Europe', roomCount: 35, themes: ['Horror', 'Mystery', 'Adventure', 'Thriller'],
    avgDifficulty: 3.2, avgPrice: '£22–£30', currency: 'GBP', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.4, nearestCities: ['london', 'birmingham', 'liverpool', 'leeds'],
    landmarks: ['Northern Quarter', 'Deansgate', 'Old Trafford'],
    language: 'en', timezone: 'Europe/London', lat: 53.4808, lng: -2.2426,
  },
  {
    city: 'Edinburgh', citySlug: 'edinburgh', country: 'United Kingdom', countrySlug: 'united-kingdom',
    continent: 'Europe', roomCount: 22, themes: ['Horror', 'Historical', 'Mystery', 'Fantasy'],
    avgDifficulty: 3.5, avgPrice: '£20–£28', currency: 'GBP', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.6, nearestCities: ['manchester', 'london', 'birmingham'],
    landmarks: ['Royal Mile', 'Edinburgh Castle', 'Old Town'],
    language: 'en', timezone: 'Europe/London', lat: 55.9533, lng: -3.1883,
  },
  {
    city: 'Birmingham', citySlug: 'birmingham', country: 'United Kingdom', countrySlug: 'united-kingdom',
    continent: 'Europe', roomCount: 18, themes: ['Horror', 'Mystery', 'Adventure'],
    avgDifficulty: 3.1, avgPrice: '£20–£28', currency: 'GBP', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['london', 'manchester', 'bristol'],
    landmarks: ['Bullring', 'Jewellery Quarter', 'Brindleyplace'],
    language: 'en', timezone: 'Europe/London', lat: 52.4862, lng: -1.8904,
  },

  // ── Germany ──
  {
    city: 'Berlin', citySlug: 'berlin', country: 'Germany', countrySlug: 'germany',
    continent: 'Europe', roomCount: 85, themes: ['Horror', 'Spy', 'Historical', 'Sci-Fi', 'Mystery'],
    avgDifficulty: 3.6, avgPrice: '€25–€35', currency: 'EUR', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.5, nearestCities: ['hamburg', 'munich', 'cologne', 'prague'],
    landmarks: ['Alexanderplatz', 'Brandenburg Gate', 'Kreuzberg', 'Friedrichshain'],
    language: 'de', timezone: 'Europe/Berlin', lat: 52.5200, lng: 13.4050,
  },
  {
    city: 'Munich', citySlug: 'munich', country: 'Germany', countrySlug: 'germany',
    continent: 'Europe', roomCount: 40, themes: ['Horror', 'Mystery', 'Adventure', 'Historical'],
    avgDifficulty: 3.4, avgPrice: '€25–€35', currency: 'EUR', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.4, nearestCities: ['berlin', 'vienna', 'zurich', 'cologne'],
    landmarks: ['Marienplatz', 'Englischer Garten', 'Maxvorstadt'],
    language: 'de', timezone: 'Europe/Berlin', lat: 48.1351, lng: 11.5820,
  },
  {
    city: 'Hamburg', citySlug: 'hamburg', country: 'Germany', countrySlug: 'germany',
    continent: 'Europe', roomCount: 30, themes: ['Mystery', 'Horror', 'Adventure', 'Thriller'],
    avgDifficulty: 3.3, avgPrice: '€22–€32', currency: 'EUR', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['berlin', 'cologne', 'amsterdam'],
    landmarks: ['Reeperbahn', 'Speicherstadt', 'HafenCity'],
    language: 'de', timezone: 'Europe/Berlin', lat: 53.5511, lng: 9.9937,
  },
  {
    city: 'Cologne', citySlug: 'cologne', country: 'Germany', countrySlug: 'germany',
    continent: 'Europe', roomCount: 25, themes: ['Mystery', 'Horror', 'Adventure'],
    avgDifficulty: 3.2, avgPrice: '€22–€30', currency: 'EUR', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['berlin', 'hamburg', 'amsterdam', 'munich'],
    landmarks: ['Cologne Cathedral', 'Old Town', 'Ehrenfeld'],
    language: 'de', timezone: 'Europe/Berlin', lat: 50.9375, lng: 6.9603,
  },

  // ── France ──
  {
    city: 'Paris', citySlug: 'paris', country: 'France', countrySlug: 'france',
    continent: 'Europe', roomCount: 95, themes: ['Mystery', 'Horror', 'Historical', 'Adventure', 'Romance'],
    avgDifficulty: 3.3, avgPrice: '€28–€38', currency: 'EUR', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.4, nearestCities: ['lyon', 'brussels', 'london', 'amsterdam'],
    landmarks: ['Eiffel Tower', 'Montmartre', 'Le Marais', 'Bastille'],
    language: 'fr', timezone: 'Europe/Paris', lat: 48.8566, lng: 2.3522,
  },
  {
    city: 'Lyon', citySlug: 'lyon', country: 'France', countrySlug: 'france',
    continent: 'Europe', roomCount: 28, themes: ['Mystery', 'Horror', 'Historical', 'Adventure'],
    avgDifficulty: 3.2, avgPrice: '€25–€32', currency: 'EUR', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['paris', 'marseille', 'geneva'],
    landmarks: ['Vieux Lyon', 'Place Bellecour', 'Presqu\'île'],
    language: 'fr', timezone: 'Europe/Paris', lat: 45.7640, lng: 4.8357,
  },
  {
    city: 'Marseille', citySlug: 'marseille', country: 'France', countrySlug: 'france',
    continent: 'Europe', roomCount: 20, themes: ['Mystery', 'Adventure', 'Horror'],
    avgDifficulty: 3.1, avgPrice: '€22–€30', currency: 'EUR', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.2, nearestCities: ['paris', 'lyon', 'barcelona'],
    landmarks: ['Vieux-Port', 'Le Panier', 'Calanques'],
    language: 'fr', timezone: 'Europe/Paris', lat: 43.2965, lng: 5.3698,
  },

  // ── Netherlands ──
  {
    city: 'Amsterdam', citySlug: 'amsterdam', country: 'Netherlands', countrySlug: 'netherlands',
    continent: 'Europe', roomCount: 50, themes: ['Horror', 'Mystery', 'Sci-Fi', 'Adventure', 'Heist'],
    avgDifficulty: 3.5, avgPrice: '€28–€38', currency: 'EUR', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.5, nearestCities: ['rotterdam', 'brussels', 'cologne', 'hamburg'],
    landmarks: ['Dam Square', 'Jordaan', 'De Pijp', 'Vondelpark'],
    language: 'nl', timezone: 'Europe/Amsterdam', lat: 52.3676, lng: 4.9041,
  },
  {
    city: 'Rotterdam', citySlug: 'rotterdam', country: 'Netherlands', countrySlug: 'netherlands',
    continent: 'Europe', roomCount: 15, themes: ['Mystery', 'Horror', 'Adventure'],
    avgDifficulty: 3.3, avgPrice: '€25–€35', currency: 'EUR', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['amsterdam', 'brussels', 'cologne'],
    landmarks: ['Erasmus Bridge', 'Markthal', 'Delfshaven'],
    language: 'nl', timezone: 'Europe/Amsterdam', lat: 51.9244, lng: 4.4777,
  },

  // ── Spain ──
  {
    city: 'Barcelona', citySlug: 'barcelona', country: 'Spain', countrySlug: 'spain',
    continent: 'Europe', roomCount: 55, themes: ['Horror', 'Mystery', 'Adventure', 'Historical', 'Fantasy'],
    avgDifficulty: 3.3, avgPrice: '€20–€30', currency: 'EUR', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.4, nearestCities: ['madrid', 'valencia', 'marseille'],
    landmarks: ['Gothic Quarter', 'El Born', 'Gràcia', 'Eixample'],
    language: 'es', timezone: 'Europe/Madrid', lat: 41.3874, lng: 2.1686,
  },
  {
    city: 'Madrid', citySlug: 'madrid', country: 'Spain', countrySlug: 'spain',
    continent: 'Europe', roomCount: 60, themes: ['Horror', 'Mystery', 'Adventure', 'Thriller', 'Historical'],
    avgDifficulty: 3.2, avgPrice: '€18–€28', currency: 'EUR', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['barcelona', 'valencia', 'lisbon'],
    landmarks: ['Gran Vía', 'Malasaña', 'Lavapiés', 'Sol'],
    language: 'es', timezone: 'Europe/Madrid', lat: 40.4168, lng: -3.7038,
  },
  {
    city: 'Valencia', citySlug: 'valencia', country: 'Spain', countrySlug: 'spain',
    continent: 'Europe', roomCount: 20, themes: ['Mystery', 'Horror', 'Adventure'],
    avgDifficulty: 3.1, avgPrice: '€18–€25', currency: 'EUR', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.2, nearestCities: ['barcelona', 'madrid'],
    landmarks: ['Ciudad de las Artes', 'El Carmen', 'Ruzafa'],
    language: 'es', timezone: 'Europe/Madrid', lat: 39.4699, lng: -0.3763,
  },

  // ── Italy ──
  {
    city: 'Rome', citySlug: 'rome', country: 'Italy', countrySlug: 'italy',
    continent: 'Europe', roomCount: 40, themes: ['Historical', 'Mystery', 'Horror', 'Adventure'],
    avgDifficulty: 3.2, avgPrice: '€22–€32', currency: 'EUR', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['milan', 'florence', 'naples'],
    landmarks: ['Colosseum', 'Trastevere', 'Testaccio', 'Prati'],
    language: 'it', timezone: 'Europe/Rome', lat: 41.9028, lng: 12.4964,
  },
  {
    city: 'Milan', citySlug: 'milan', country: 'Italy', countrySlug: 'italy',
    continent: 'Europe', roomCount: 35, themes: ['Mystery', 'Horror', 'Sci-Fi', 'Thriller'],
    avgDifficulty: 3.4, avgPrice: '€25–€35', currency: 'EUR', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.4, nearestCities: ['rome', 'florence', 'zurich', 'vienna'],
    landmarks: ['Navigli', 'Brera', 'Porta Romana', 'Duomo'],
    language: 'it', timezone: 'Europe/Rome', lat: 45.4642, lng: 9.1900,
  },
  {
    city: 'Florence', citySlug: 'florence', country: 'Italy', countrySlug: 'italy',
    continent: 'Europe', roomCount: 15, themes: ['Historical', 'Mystery', 'Art', 'Adventure'],
    avgDifficulty: 3.1, avgPrice: '€20–€28', currency: 'EUR', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['rome', 'milan'],
    landmarks: ['Duomo', 'Oltrarno', 'Santa Croce'],
    language: 'it', timezone: 'Europe/Rome', lat: 43.7696, lng: 11.2558,
  },

  // ── Portugal ──
  {
    city: 'Lisbon', citySlug: 'lisbon', country: 'Portugal', countrySlug: 'portugal',
    continent: 'Europe', roomCount: 30, themes: ['Mystery', 'Horror', 'Historical', 'Adventure'],
    avgDifficulty: 3.2, avgPrice: '€18–€25', currency: 'EUR', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.4, nearestCities: ['porto', 'madrid'],
    landmarks: ['Alfama', 'Bairro Alto', 'Belém', 'LX Factory'],
    language: 'pt', timezone: 'Europe/Lisbon', lat: 38.7223, lng: -9.1393,
  },
  {
    city: 'Porto', citySlug: 'porto', country: 'Portugal', countrySlug: 'portugal',
    continent: 'Europe', roomCount: 15, themes: ['Mystery', 'Horror', 'Adventure'],
    avgDifficulty: 3.0, avgPrice: '€15–€22', currency: 'EUR', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['lisbon', 'madrid'],
    landmarks: ['Ribeira', 'Cedofeita', 'Vila Nova de Gaia'],
    language: 'pt', timezone: 'Europe/Lisbon', lat: 41.1579, lng: -8.6291,
  },

  // ── Belgium ──
  {
    city: 'Brussels', citySlug: 'brussels', country: 'Belgium', countrySlug: 'belgium',
    continent: 'Europe', roomCount: 25, themes: ['Mystery', 'Horror', 'Spy', 'Adventure'],
    avgDifficulty: 3.3, avgPrice: '€25–€35', currency: 'EUR', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['amsterdam', 'paris', 'cologne'],
    landmarks: ['Grand Place', 'Marolles', 'Ixelles', 'Saint-Gilles'],
    language: 'fr', timezone: 'Europe/Brussels', lat: 50.8503, lng: 4.3517,
  },

  // ── Austria ──
  {
    city: 'Vienna', citySlug: 'vienna', country: 'Austria', countrySlug: 'austria',
    continent: 'Europe', roomCount: 35, themes: ['Mystery', 'Horror', 'Historical', 'Thriller', 'Spy'],
    avgDifficulty: 3.5, avgPrice: '€25–€35', currency: 'EUR', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.5, nearestCities: ['prague', 'budapest', 'munich', 'milan'],
    landmarks: ['Innere Stadt', 'Leopoldstadt', 'Neubau', 'Mariahilf'],
    language: 'de', timezone: 'Europe/Vienna', lat: 48.2082, lng: 16.3738,
  },

  // ── Czech Republic ──
  {
    city: 'Prague', citySlug: 'prague', country: 'Czech Republic', countrySlug: 'czech-republic',
    continent: 'Europe', roomCount: 45, themes: ['Horror', 'Mystery', 'Historical', 'Fantasy', 'Thriller'],
    avgDifficulty: 3.4, avgPrice: '€15–€22', currency: 'CZK', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.6, nearestCities: ['vienna', 'berlin', 'budapest'],
    landmarks: ['Old Town', 'Žižkov', 'Vinohrady', 'Smíchov'],
    language: 'cs', timezone: 'Europe/Prague', lat: 50.0755, lng: 14.4378,
  },

  // ── Hungary ──
  {
    city: 'Budapest', citySlug: 'budapest', country: 'Hungary', countrySlug: 'hungary',
    continent: 'Europe', roomCount: 60, themes: ['Horror', 'Mystery', 'Historical', 'Sci-Fi', 'Adventure'],
    avgDifficulty: 3.6, avgPrice: '€15–€22', currency: 'HUF', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.7, nearestCities: ['vienna', 'prague', 'bratislava'],
    landmarks: ['District VII', 'Buda Castle', 'Ruin Bar District'],
    language: 'hu', timezone: 'Europe/Budapest', lat: 47.4979, lng: 19.0402,
  },

  // ── Poland ──
  {
    city: 'Warsaw', citySlug: 'warsaw', country: 'Poland', countrySlug: 'poland',
    continent: 'Europe', roomCount: 50, themes: ['Horror', 'Mystery', 'Historical', 'Thriller'],
    avgDifficulty: 3.5, avgPrice: '€12–€18', currency: 'PLN', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.5, nearestCities: ['krakow', 'berlin', 'prague'],
    landmarks: ['Old Town', 'Praga', 'Mokotów', 'Wola'],
    language: 'pl', timezone: 'Europe/Warsaw', lat: 52.2297, lng: 21.0122,
  },
  {
    city: 'Krakow', citySlug: 'krakow', country: 'Poland', countrySlug: 'poland',
    continent: 'Europe', roomCount: 35, themes: ['Horror', 'Historical', 'Mystery', 'Adventure'],
    avgDifficulty: 3.4, avgPrice: '€10–€16', currency: 'PLN', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.6, nearestCities: ['warsaw', 'prague', 'vienna', 'budapest'],
    landmarks: ['Old Town', 'Kazimierz', 'Podgórze'],
    language: 'pl', timezone: 'Europe/Warsaw', lat: 50.0647, lng: 19.9450,
  },

  // ── Switzerland ──
  {
    city: 'Zurich', citySlug: 'zurich', country: 'Switzerland', countrySlug: 'switzerland',
    continent: 'Europe', roomCount: 20, themes: ['Mystery', 'Sci-Fi', 'Thriller', 'Adventure'],
    avgDifficulty: 3.5, avgPrice: 'CHF 35–50', currency: 'CHF', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.4, nearestCities: ['geneva', 'munich', 'milan'],
    landmarks: ['Niederdorf', 'Langstrasse', 'Zurich West'],
    language: 'de', timezone: 'Europe/Zurich', lat: 47.3769, lng: 8.5417,
  },
  {
    city: 'Geneva', citySlug: 'geneva', country: 'Switzerland', countrySlug: 'switzerland',
    continent: 'Europe', roomCount: 12, themes: ['Mystery', 'Spy', 'Thriller'],
    avgDifficulty: 3.3, avgPrice: 'CHF 32–45', currency: 'CHF', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['zurich', 'lyon', 'paris'],
    landmarks: ['Old Town', 'Carouge', 'Plainpalais'],
    language: 'fr', timezone: 'Europe/Zurich', lat: 46.2044, lng: 6.1432,
  },

  // ── Denmark ──
  {
    city: 'Copenhagen', citySlug: 'copenhagen', country: 'Denmark', countrySlug: 'denmark',
    continent: 'Europe', roomCount: 20, themes: ['Mystery', 'Horror', 'Sci-Fi', 'Adventure'],
    avgDifficulty: 3.4, avgPrice: 'DKK 200–300', currency: 'DKK', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.4, nearestCities: ['hamburg', 'stockholm', 'amsterdam'],
    landmarks: ['Nørrebro', 'Vesterbro', 'Christianshavn'],
    language: 'da', timezone: 'Europe/Copenhagen', lat: 55.6761, lng: 12.5683,
  },

  // ── Sweden ──
  {
    city: 'Stockholm', citySlug: 'stockholm', country: 'Sweden', countrySlug: 'sweden',
    continent: 'Europe', roomCount: 25, themes: ['Mystery', 'Horror', 'Sci-Fi', 'Thriller'],
    avgDifficulty: 3.5, avgPrice: 'SEK 250–350', currency: 'SEK', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.4, nearestCities: ['copenhagen', 'oslo', 'helsinki'],
    landmarks: ['Södermalm', 'Gamla Stan', 'Östermalm'],
    language: 'sv', timezone: 'Europe/Stockholm', lat: 59.3293, lng: 18.0686,
  },

  // ── Norway ──
  {
    city: 'Oslo', citySlug: 'oslo', country: 'Norway', countrySlug: 'norway',
    continent: 'Europe', roomCount: 15, themes: ['Mystery', 'Horror', 'Adventure'],
    avgDifficulty: 3.3, avgPrice: 'NOK 300–400', currency: 'NOK', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['stockholm', 'copenhagen'],
    landmarks: ['Grünerløkka', 'Aker Brygge', 'Majorstuen'],
    language: 'no', timezone: 'Europe/Oslo', lat: 59.9139, lng: 10.7522,
  },

  // ── Finland ──
  {
    city: 'Helsinki', citySlug: 'helsinki', country: 'Finland', countrySlug: 'finland',
    continent: 'Europe', roomCount: 18, themes: ['Mystery', 'Horror', 'Sci-Fi'],
    avgDifficulty: 3.4, avgPrice: '€25–€35', currency: 'EUR', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['stockholm', 'oslo'],
    landmarks: ['Kallio', 'Punavuori', 'Kamppi'],
    language: 'fi', timezone: 'Europe/Helsinki', lat: 60.1699, lng: 24.9384,
  },

  // ── Romania ──
  {
    city: 'Bucharest', citySlug: 'bucharest', country: 'Romania', countrySlug: 'romania',
    continent: 'Europe', roomCount: 45, themes: ['Horror', 'Mystery', 'Historical', 'Thriller'],
    avgDifficulty: 3.5, avgPrice: '€10–€18', currency: 'RON', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.5, nearestCities: ['budapest', 'sofia'],
    landmarks: ['Old Town', 'Floreasca', 'Herastrau'],
    language: 'ro', timezone: 'Europe/Bucharest', lat: 44.4268, lng: 26.1025,
  },

  // ── Bulgaria ──
  {
    city: 'Sofia', citySlug: 'sofia', country: 'Bulgaria', countrySlug: 'bulgaria',
    continent: 'Europe', roomCount: 25, themes: ['Horror', 'Mystery', 'Adventure', 'Historical'],
    avgDifficulty: 3.3, avgPrice: '€8–€15', currency: 'BGN', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.4, nearestCities: ['bucharest', 'budapest'],
    landmarks: ['Vitosha Boulevard', 'Oborishte', 'Lozenets'],
    language: 'bg', timezone: 'Europe/Sofia', lat: 42.6977, lng: 23.3219,
  },

  // ── Croatia ──
  {
    city: 'Zagreb', citySlug: 'zagreb', country: 'Croatia', countrySlug: 'croatia',
    continent: 'Europe', roomCount: 18, themes: ['Mystery', 'Horror', 'Adventure'],
    avgDifficulty: 3.2, avgPrice: '€12–€20', currency: 'EUR', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.4, nearestCities: ['vienna', 'budapest', 'ljubljana'],
    landmarks: ['Upper Town', 'Tkalčićeva', 'Jarun'],
    language: 'hr', timezone: 'Europe/Zagreb', lat: 45.8150, lng: 15.9819,
  },

  // ── Slovenia ──
  {
    city: 'Ljubljana', citySlug: 'ljubljana', country: 'Slovenia', countrySlug: 'slovenia',
    continent: 'Europe', roomCount: 10, themes: ['Mystery', 'Adventure', 'Horror'],
    avgDifficulty: 3.1, avgPrice: '€15–€22', currency: 'EUR', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['zagreb', 'vienna'],
    landmarks: ['Old Town', 'Metelkova', 'Tivoli'],
    language: 'sl', timezone: 'Europe/Ljubljana', lat: 46.0569, lng: 14.5058,
  },

  // ── USA ──
  {
    city: 'New York', citySlug: 'new-york', country: 'United States', countrySlug: 'united-states',
    continent: 'North America', roomCount: 100, themes: ['Horror', 'Mystery', 'Sci-Fi', 'Heist', 'Adventure'],
    avgDifficulty: 3.5, avgPrice: '$30–$45', currency: 'USD', avgGroupSize: '2–8', avgDuration: '60 min',
    avgRating: 4.4, nearestCities: ['los-angeles', 'chicago', 'miami', 'boston'],
    landmarks: ['Times Square', 'Midtown', 'Lower East Side', 'Brooklyn'],
    language: 'en', timezone: 'America/New_York', lat: 40.7128, lng: -74.0060,
  },
  {
    city: 'Los Angeles', citySlug: 'los-angeles', country: 'United States', countrySlug: 'united-states',
    continent: 'North America', roomCount: 75, themes: ['Horror', 'Mystery', 'Sci-Fi', 'Hollywood', 'Adventure'],
    avgDifficulty: 3.4, avgPrice: '$30–$42', currency: 'USD', avgGroupSize: '2–8', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['new-york', 'san-francisco', 'chicago'],
    landmarks: ['Hollywood', 'Downtown LA', 'Santa Monica', 'Koreatown'],
    language: 'en', timezone: 'America/Los_Angeles', lat: 34.0522, lng: -118.2437,
  },
  {
    city: 'Chicago', citySlug: 'chicago', country: 'United States', countrySlug: 'united-states',
    continent: 'North America', roomCount: 50, themes: ['Horror', 'Mystery', 'Heist', 'Adventure'],
    avgDifficulty: 3.3, avgPrice: '$28–$40', currency: 'USD', avgGroupSize: '2–8', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['new-york', 'los-angeles', 'miami'],
    landmarks: ['Loop', 'Wicker Park', 'Lincoln Park', 'River North'],
    language: 'en', timezone: 'America/Chicago', lat: 41.8781, lng: -87.6298,
  },
  {
    city: 'Miami', citySlug: 'miami', country: 'United States', countrySlug: 'united-states',
    continent: 'North America', roomCount: 35, themes: ['Horror', 'Mystery', 'Adventure', 'Tropical'],
    avgDifficulty: 3.2, avgPrice: '$28–$38', currency: 'USD', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.2, nearestCities: ['new-york', 'los-angeles', 'chicago'],
    landmarks: ['South Beach', 'Wynwood', 'Brickell', 'Little Havana'],
    language: 'en', timezone: 'America/New_York', lat: 25.7617, lng: -80.1918,
  },
  {
    city: 'San Francisco', citySlug: 'san-francisco', country: 'United States', countrySlug: 'united-states',
    continent: 'North America', roomCount: 30, themes: ['Sci-Fi', 'Mystery', 'Horror', 'Tech'],
    avgDifficulty: 3.6, avgPrice: '$32–$45', currency: 'USD', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.4, nearestCities: ['los-angeles', 'new-york', 'chicago'],
    landmarks: ['Mission District', 'SoMa', 'Fisherman\'s Wharf', 'Union Square'],
    language: 'en', timezone: 'America/Los_Angeles', lat: 37.7749, lng: -122.4194,
  },
  {
    city: 'Boston', citySlug: 'boston', country: 'United States', countrySlug: 'united-states',
    continent: 'North America', roomCount: 25, themes: ['Mystery', 'Historical', 'Horror', 'Thriller'],
    avgDifficulty: 3.4, avgPrice: '$28–$40', currency: 'USD', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['new-york', 'chicago'],
    landmarks: ['Back Bay', 'Cambridge', 'Faneuil Hall', 'Beacon Hill'],
    language: 'en', timezone: 'America/New_York', lat: 42.3601, lng: -71.0589,
  },

  // ── Canada ──
  {
    city: 'Toronto', citySlug: 'toronto', country: 'Canada', countrySlug: 'canada',
    continent: 'North America', roomCount: 45, themes: ['Horror', 'Mystery', 'Sci-Fi', 'Adventure'],
    avgDifficulty: 3.4, avgPrice: 'CA$28–$40', currency: 'CAD', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.4, nearestCities: ['montreal', 'vancouver', 'new-york'],
    landmarks: ['Downtown', 'Kensington Market', 'Distillery District'],
    language: 'en', timezone: 'America/Toronto', lat: 43.6532, lng: -79.3832,
  },
  {
    city: 'Montreal', citySlug: 'montreal', country: 'Canada', countrySlug: 'canada',
    continent: 'North America', roomCount: 30, themes: ['Horror', 'Mystery', 'Adventure', 'Historical'],
    avgDifficulty: 3.3, avgPrice: 'CA$25–$35', currency: 'CAD', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['toronto', 'vancouver', 'new-york'],
    landmarks: ['Old Montreal', 'Plateau', 'Mile End'],
    language: 'fr', timezone: 'America/Montreal', lat: 45.5017, lng: -73.5673,
  },
  {
    city: 'Vancouver', citySlug: 'vancouver', country: 'Canada', countrySlug: 'canada',
    continent: 'North America', roomCount: 25, themes: ['Mystery', 'Horror', 'Sci-Fi', 'Adventure'],
    avgDifficulty: 3.4, avgPrice: 'CA$28–$38', currency: 'CAD', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.4, nearestCities: ['toronto', 'montreal'],
    landmarks: ['Gastown', 'Yaletown', 'Kitsilano', 'Commercial Drive'],
    language: 'en', timezone: 'America/Vancouver', lat: 49.2827, lng: -123.1207,
  },

  // ── Australia ──
  {
    city: 'Sydney', citySlug: 'sydney', country: 'Australia', countrySlug: 'australia',
    continent: 'Oceania', roomCount: 35, themes: ['Horror', 'Mystery', 'Adventure', 'Sci-Fi'],
    avgDifficulty: 3.3, avgPrice: 'A$35–$50', currency: 'AUD', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: ['melbourne'],
    landmarks: ['CBD', 'Surry Hills', 'Newtown', 'Darlinghurst'],
    language: 'en', timezone: 'Australia/Sydney', lat: -33.8688, lng: 151.2093,
  },
  {
    city: 'Melbourne', citySlug: 'melbourne', country: 'Australia', countrySlug: 'australia',
    continent: 'Oceania', roomCount: 30, themes: ['Horror', 'Mystery', 'Adventure', 'Fantasy'],
    avgDifficulty: 3.4, avgPrice: 'A$32–$48', currency: 'AUD', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.4, nearestCities: ['sydney'],
    landmarks: ['CBD', 'Fitzroy', 'St Kilda', 'Collingwood'],
    language: 'en', timezone: 'Australia/Melbourne', lat: -37.8136, lng: 144.9631,
  },

  // ── Japan ──
  {
    city: 'Tokyo', citySlug: 'tokyo', country: 'Japan', countrySlug: 'japan',
    continent: 'Asia', roomCount: 80, themes: ['Horror', 'Anime', 'Mystery', 'Sci-Fi', 'Fantasy'],
    avgDifficulty: 3.7, avgPrice: '¥3,000–¥4,500', currency: 'JPY', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.6, nearestCities: ['osaka'],
    landmarks: ['Shinjuku', 'Shibuya', 'Akihabara', 'Asakusa'],
    language: 'ja', timezone: 'Asia/Tokyo', lat: 35.6762, lng: 139.6503,
  },
  {
    city: 'Osaka', citySlug: 'osaka', country: 'Japan', countrySlug: 'japan',
    continent: 'Asia', roomCount: 40, themes: ['Horror', 'Mystery', 'Anime', 'Adventure'],
    avgDifficulty: 3.5, avgPrice: '¥2,500–¥4,000', currency: 'JPY', avgGroupSize: '2–5', avgDuration: '60 min',
    avgRating: 4.5, nearestCities: ['tokyo'],
    landmarks: ['Dotonbori', 'Namba', 'Umeda', 'Amerikamura'],
    language: 'ja', timezone: 'Asia/Tokyo', lat: 34.6937, lng: 135.5023,
  },

  // ── South Korea ──
  {
    city: 'Seoul', citySlug: 'seoul', country: 'South Korea', countrySlug: 'south-korea',
    continent: 'Asia', roomCount: 70, themes: ['Horror', 'Mystery', 'K-Drama', 'Thriller', 'Sci-Fi'],
    avgDifficulty: 3.6, avgPrice: '₩18,000–₩25,000', currency: 'KRW', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.5, nearestCities: ['tokyo', 'osaka'],
    landmarks: ['Hongdae', 'Gangnam', 'Myeongdong', 'Itaewon'],
    language: 'ko', timezone: 'Asia/Seoul', lat: 37.5665, lng: 126.9780,
  },

  // ── UAE ──
  {
    city: 'Dubai', citySlug: 'dubai', country: 'United Arab Emirates', countrySlug: 'united-arab-emirates',
    continent: 'Asia', roomCount: 25, themes: ['Horror', 'Mystery', 'Adventure', 'Luxury'],
    avgDifficulty: 3.3, avgPrice: 'AED 120–180', currency: 'AED', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: [],
    landmarks: ['Dubai Mall', 'JBR', 'Al Quoz', 'DIFC'],
    language: 'en', timezone: 'Asia/Dubai', lat: 25.2048, lng: 55.2708,
  },

  // ── Singapore ──
  {
    city: 'Singapore', citySlug: 'singapore', country: 'Singapore', countrySlug: 'singapore',
    continent: 'Asia', roomCount: 20, themes: ['Horror', 'Mystery', 'Sci-Fi', 'Adventure'],
    avgDifficulty: 3.4, avgPrice: 'S$28–$40', currency: 'SGD', avgGroupSize: '2–6', avgDuration: '60 min',
    avgRating: 4.3, nearestCities: [],
    landmarks: ['Bugis', 'Clarke Quay', 'Chinatown', 'Orchard'],
    language: 'en', timezone: 'Asia/Singapore', lat: 1.3521, lng: 103.8198,
  },
];

// ── Helper functions ──

export function getCityBySlug(countrySlug: string, citySlug: string): CityData | undefined {
  return CITIES.find((c) => c.countrySlug === countrySlug && c.citySlug === citySlug);
}

export function getCitiesByCountry(countrySlug: string): CityData[] {
  return CITIES.filter((c) => c.countrySlug === countrySlug);
}

export function getCountries(): { country: string; countrySlug: string; cityCount: number; totalRooms: number }[] {
  const map = new Map<string, { country: string; countrySlug: string; cityCount: number; totalRooms: number }>();
  for (const c of CITIES) {
    const existing = map.get(c.countrySlug);
    if (existing) {
      existing.cityCount++;
      existing.totalRooms += c.roomCount;
    } else {
      map.set(c.countrySlug, { country: c.country, countrySlug: c.countrySlug, cityCount: 1, totalRooms: c.roomCount });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalRooms - a.totalRooms);
}

export function getNearbyCities(city: CityData): CityData[] {
  return city.nearestCities
    .map((slug) => CITIES.find((c) => c.citySlug === slug))
    .filter((c): c is CityData => c !== undefined);
}

export function getAllThemes(): string[] {
  const set = new Set<string>();
  for (const c of CITIES) c.themes.forEach((t) => set.add(t));
  return Array.from(set).sort();
}

export const MODIFIERS = [
  { slug: 'horror', theme: 'Horror' },
  { slug: 'mystery', theme: 'Mystery' },
  { slug: 'sci-fi', theme: 'Sci-Fi' },
  { slug: 'adventure', theme: 'Adventure' },
  { slug: 'for-kids', theme: null },
  { slug: 'for-couples', theme: null },
  { slug: 'for-teams', theme: null },
  { slug: 'for-beginners', theme: null },
  { slug: 'best-rated', theme: null },
] as const;
