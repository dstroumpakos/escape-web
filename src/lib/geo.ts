/**
 * Countries and their main cities, for the job ads (company picks a country, then a city).
 * Country names come from Intl.DisplayNames in the visitor's language.
 * A city is stored by its English name; "English|Local" adds the local spelling,
 * shown when the site speaks that country's language (Αθήνα for Greek visitors).
 * Countries of the languages the site is translated into come first.
 */

export type Country = { code: string; lang?: string; cities: string[] };

export const COUNTRIES: Country[] = [
  {
    code: 'GR',
    lang: 'el',
    cities: [
      'Athens|Αθήνα', 'Thessaloniki|Θεσσαλονίκη', 'Piraeus|Πειραιάς', 'Patras|Πάτρα', 'Heraklion|Ηράκλειο', 'Larissa|Λάρισα',
      'Volos|Βόλος', 'Ioannina|Ιωάννινα', 'Chania|Χανιά', 'Rethymno|Ρέθυμνο', 'Kalamata|Καλαμάτα', 'Trikala|Τρίκαλα',
      'Serres|Σέρρες', 'Kavala|Καβάλα', 'Komotini|Κομοτηνή', 'Alexandroupoli|Αλεξανδρούπολη', 'Xanthi|Ξάνθη', 'Drama|Δράμα',
      'Katerini|Κατερίνη', 'Veria|Βέροια', 'Kozani|Κοζάνη', 'Kastoria|Καστοριά', 'Florina|Φλώρινα', 'Giannitsa|Γιαννιτσά',
      'Lamia|Λαμία', 'Chalkida|Χαλκίδα', 'Agrinio|Αγρίνιο', 'Corinth|Κόρινθος', 'Tripoli|Τρίπολη', 'Nafplio|Ναύπλιο',
      'Pyrgos|Πύργος', 'Sparti|Σπάρτη', 'Karditsa|Καρδίτσα', 'Preveza|Πρέβεζα', 'Arta|Άρτα', 'Corfu|Κέρκυρα',
      'Zakynthos|Ζάκυνθος', 'Kefalonia|Κεφαλονιά', 'Rhodes|Ρόδος', 'Kos|Κως', 'Mytilene|Μυτιλήνη', 'Chios|Χίος',
      'Syros|Σύρος', 'Naxos|Νάξος', 'Santorini|Σαντορίνη', 'Mykonos|Μύκονος', 'Agios Nikolaos|Άγιος Νικόλαος',
    ],
  },
  {
    code: 'GB',
    lang: 'en',
    cities: [
      'London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Newcastle', 'Nottingham', 'Leicester',
      'Brighton', 'Oxford', 'Cambridge', 'Southampton', 'Glasgow', 'Edinburgh', 'Aberdeen', 'Cardiff', 'Belfast',
    ],
  },
  {
    code: 'NL',
    lang: 'nl',
    cities: [
      'Amsterdam', 'Rotterdam', 'The Hague|Den Haag', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda',
      'Nijmegen', 'Arnhem', 'Haarlem', 'Enschede', 'Maastricht', 'Leiden', 'Zwolle', 'Den Bosch',
    ],
  },
  {
    code: 'DE',
    lang: 'de',
    cities: [
      'Berlin', 'Hamburg', 'Munich|München', 'Cologne|Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund',
      'Essen', 'Bremen', 'Dresden', 'Hanover|Hannover', 'Nuremberg|Nürnberg', 'Bonn', 'Münster', 'Mannheim', 'Freiburg',
    ],
  },
  {
    code: 'FR',
    lang: 'fr',
    cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Grenoble', 'Dijon'],
  },
  {
    code: 'ES',
    lang: 'es',
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville|Sevilla', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Bilbao', 'Alicante', 'Valladolid', 'Granada', 'Las Palmas'],
  },
  {
    code: 'IT',
    lang: 'it',
    cities: ['Rome|Roma', 'Milan|Milano', 'Naples|Napoli', 'Turin|Torino', 'Palermo', 'Genoa|Genova', 'Bologna', 'Florence|Firenze', 'Bari', 'Catania', 'Venice|Venezia', 'Verona', 'Padua|Padova'],
  },
  {
    code: 'PT',
    lang: 'pt',
    cities: ['Lisbon|Lisboa', 'Porto', 'Braga', 'Coimbra', 'Faro', 'Aveiro', 'Funchal', 'Setúbal', 'Évora', 'Viseu'],
  },
  {
    code: 'PL',
    lang: 'pl',
    cities: ['Warsaw|Warszawa', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Lublin', 'Katowice', 'Białystok', 'Gdynia'],
  },
  {
    code: 'RO',
    lang: 'ro',
    cities: ['Bucharest|București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Brașov', 'Craiova', 'Galați', 'Oradea', 'Sibiu'],
  },
  {
    code: 'BG',
    lang: 'bg',
    cities: ['Sofia|София', 'Plovdiv|Пловдив', 'Varna|Варна', 'Burgas|Бургас', 'Ruse|Русе', 'Stara Zagora|Стара Загора', 'Pleven|Плевен', 'Blagoevgrad|Благоевград'],
  },
  {
    code: 'TR',
    lang: 'tr',
    cities: ['Istanbul|İstanbul', 'Ankara', 'Izmir|İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Eskişehir', 'Mersin'],
  },
  {
    code: 'RU',
    lang: 'ru',
    cities: ['Moscow|Москва', 'Saint Petersburg|Санкт-Петербург', 'Novosibirsk|Новосибирск', 'Yekaterinburg|Екатеринбург', 'Kazan|Казань', 'Nizhny Novgorod|Нижний Новгород', 'Samara|Самара', 'Krasnodar|Краснодар', 'Sochi|Сочи'],
  },
  {
    code: 'UA',
    lang: 'uk',
    cities: ['Kyiv|Київ', 'Kharkiv|Харків', 'Odesa|Одеса', 'Dnipro|Дніпро', 'Lviv|Львів', 'Zaporizhzhia|Запоріжжя', 'Vinnytsia|Вінниця'],
  },
  {
    code: 'SA',
    lang: 'ar',
    cities: ['Riyadh|الرياض', 'Jeddah|جدة', 'Mecca|مكة', 'Medina|المدينة المنورة', 'Dammam|الدمام', 'Khobar|الخبر'],
  },
  {
    code: 'CN',
    lang: 'zh',
    cities: ['Shanghai|上海', 'Beijing|北京', 'Guangzhou|广州', 'Shenzhen|深圳', 'Chengdu|成都', 'Hangzhou|杭州', 'Wuhan|武汉', "Xi'an|西安", 'Nanjing|南京', 'Chongqing|重庆'],
  },
  {
    code: 'JP',
    lang: 'ja',
    cities: ['Tokyo|東京', 'Osaka|大阪', 'Yokohama|横浜', 'Nagoya|名古屋', 'Sapporo|札幌', 'Fukuoka|福岡', 'Kobe|神戸', 'Kyoto|京都', 'Hiroshima|広島'],
  },
  {
    code: 'KR',
    lang: 'ko',
    cities: ['Seoul|서울', 'Busan|부산', 'Incheon|인천', 'Daegu|대구', 'Daejeon|대전', 'Gwangju|광주', 'Suwon|수원', 'Ulsan|울산'],
  },
  // Other countries
  { code: 'CY', lang: 'el', cities: ['Nicosia|Λευκωσία', 'Limassol|Λεμεσός', 'Larnaca|Λάρνακα', 'Paphos|Πάφος', 'Ayia Napa|Αγία Νάπα', 'Paralimni|Παραλίμνι'] },
  { code: 'BE', cities: ['Brussels', 'Antwerp', 'Ghent', 'Bruges', 'Leuven', 'Liège', 'Charleroi', 'Namur'] },
  { code: 'AT', lang: 'de', cities: ['Vienna|Wien', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt'] },
  { code: 'CH', cities: ['Zurich|Zürich', 'Geneva|Genève', 'Basel', 'Bern', 'Lausanne', 'Lucerne|Luzern', 'Lugano'] },
  { code: 'IE', lang: 'en', cities: ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford'] },
  { code: 'US', lang: 'en', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin', 'San Francisco', 'Seattle', 'Boston', 'Miami', 'Las Vegas', 'Orlando', 'Atlanta', 'Denver'] },
  { code: 'CA', lang: 'en', cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City'] },
  { code: 'AU', lang: 'en', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra'] },
  { code: 'CZ', cities: ['Prague', 'Brno', 'Ostrava', 'Plzeň', 'Olomouc'] },
  { code: 'HU', cities: ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs', 'Győr'] },
  { code: 'SK', cities: ['Bratislava', 'Košice', 'Žilina', 'Nitra'] },
  { code: 'SI', cities: ['Ljubljana', 'Maribor', 'Celje', 'Koper'] },
  { code: 'HR', cities: ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Dubrovnik'] },
  { code: 'RS', cities: ['Belgrade', 'Novi Sad', 'Niš', 'Kragujevac', 'Subotica'] },
  { code: 'MK', cities: ['Skopje', 'Bitola', 'Ohrid', 'Kumanovo', 'Tetovo'] },
  { code: 'AL', cities: ['Tirana', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Korçë'] },
  { code: 'SE', cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Linköping', 'Örebro'] },
  { code: 'DK', cities: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg'] },
  { code: 'NO', cities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger'] },
  { code: 'FI', cities: ['Helsinki', 'Espoo', 'Tampere', 'Turku', 'Oulu'] },
  { code: 'EE', cities: ['Tallinn', 'Tartu'] },
  { code: 'LV', cities: ['Riga', 'Daugavpils'] },
  { code: 'LT', cities: ['Vilnius', 'Kaunas', 'Klaipėda'] },
  { code: 'MT', cities: ['Valletta', 'Sliema', "St Julian's", 'Birkirkara'] },
  { code: 'LU', cities: ['Luxembourg', 'Esch-sur-Alzette'] },
  { code: 'IL', cities: ['Tel Aviv', 'Jerusalem', 'Haifa', 'Beersheba'] },
  { code: 'AE', lang: 'ar', cities: ['Dubai|دبي', 'Abu Dhabi|أبوظبي', 'Sharjah|الشارقة', 'Ajman|عجمان'] },
  { code: 'EG', lang: 'ar', cities: ['Cairo|القاهرة', 'Alexandria|الإسكندرية', 'Giza|الجيزة', 'Hurghada|الغردقة'] },
  { code: 'BR', lang: 'pt', cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Belo Horizonte', 'Curitiba', 'Porto Alegre'] },
  { code: 'MX', lang: 'es', cities: ['Mexico City|Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Cancún', 'Tijuana'] },
  { code: 'AR', lang: 'es', cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza'] },
  { code: 'IN', cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune'] },
  { code: 'SG', cities: ['Singapore'] },
  { code: 'ZA', cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'] },
];

/** COUNTRIES before this index are the countries of the site's languages; the rest follow. */
export const FIRST_OTHER = COUNTRIES.findIndex((c) => c.code === 'CY');

export const COUNTRY_CODES = COUNTRIES.map((c) => c.code);

export function findCountry(code: string | undefined | null): Country | undefined {
  return code ? COUNTRIES.find((c) => c.code === code) : undefined;
}

/** The English (stored) name of a city entry. */
export const cityKey = (entry: string) => entry.split('|')[0];

/** How a stored city reads for a visitor in `language` (local spelling when the site speaks that country's language). */
export function cityLabel(city: string, countryCode: string | undefined, language: string): string {
  const c = findCountry(countryCode);
  const entry = c?.cities.find((e) => cityKey(e) === city);
  if (!entry || !entry.includes('|')) return city;
  return c?.lang === language ? entry.split('|')[1] : city;
}

/** Finds the country whose list has this city (in either spelling), for older data without a country. */
export function countryOfCity(city: string): { country: string; city: string } | null {
  const q = city.trim().toLowerCase();
  if (!q) return null;
  for (const c of COUNTRIES) {
    for (const e of c.cities) if (e.toLowerCase().split('|').includes(q)) return { country: c.code, city: cityKey(e) };
  }
  return null;
}

const nameCache = new Map<string, Intl.DisplayNames | null>();
/** The country's name in the visitor's language. */
export function countryName(code: string, locale: string): string {
  if (!nameCache.has(locale)) {
    try {
      nameCache.set(locale, new Intl.DisplayNames([locale, 'en'], { type: 'region' }));
    } catch {
      nameCache.set(locale, null);
    }
  }
  return nameCache.get(locale)?.of(code) ?? code;
}
