/**
 * WanderGenie — Fallback Itinerary Service  (v3)
 * ───────────────────────────────────────────────
 * Used ONLY when Groq is completely unreachable or the API key is missing.
 *
 * v3 fix: rebuilt with destination-specific activity pools and real place
 * names so even the fallback produces useful, specific output instead of
 * generic template text like "morning stroll through the old quarter".
 */

"use strict";

// ─── Destination knowledge base ───────────────────────────────────────────────

const DESTINATIONS = {
  goa: {
    region: "coastal",
    areas: ["Baga Beach area", "Anjuna–Vagator strip", "Panaji & Old Goa", "South Goa – Palolem"],
    highlights: [
      "Baga Beach — water sports & beach shacks",
      "Anjuna Flea Market (every Wednesday)",
      "Chapora Fort & Vagator Beach viewpoint",
      "Basilica of Bom Jesus, Old Goa (UNESCO)",
      "Fort Aguada sunset point",
      "Dudhsagar Falls day trip (60 km)",
      "Fontainhas Latin Quarter walk, Panaji",
      "Calangute Beach strip",
    ],
    restaurants: [
      "Vinayak Family Restaurant, North Goa (seafood thali ₹250)",
      "Britto's, Baga Beach (fish curry rice ₹350)",
      "Thalassa, Vagator (Greek-Goan fusion ₹800)",
      "Gunpowder, Assagao (Kerala-Goan ₹600)",
      "Fisherman's Wharf, Cavelossim (grilled prawns ₹700)",
      "Infantaria, Calangute (pastries & breakfast ₹200)",
    ],
    activities: {
      beaches:   ["Scuba diving Grande Island with Barracuda Diving (₹3500)", "Parasailing at Baga Beach (₹700)", "Jet-ski at Calangute (₹600/15 min)", "Dolphin cruise from Candolim jetty (₹300)", "Sunset river cruise, Mandovi River (₹400)"],
      nightlife: ["Bar-hopping Tito's Lane, Baga (from 10 PM)", "LPK Waterfront club, Candolim", "Sunset drinks at Curlies beach shack, Anjuna", "Club Cabana, Arpora hillside (Saturday nights)"],
      food:      ["Goan spice plantation tour with lunch, Ponda (₹600)", "Street food walk — chorizo pao & bebinca, Panaji", "Anjuna Flea Market street eats (Wednesday)"],
      culture:   ["Old Goa UNESCO churches walk (free)", "Fontainhas heritage quarter, Panaji", "Ancestral Goa museum, Loutolim (₹100)"],
      shopping:  ["Anjuna Flea Market (Wednesday, 9 AM–6 PM)", "Mapusa Friday Market (local produce & crafts)", "Calangute market lane — beachwear & souvenirs"],
      adventure: ["White-water kayaking, Mhadei Wildlife Sanctuary", "Dudhsagar trek via Kullem (full day, guide ₹800)", "Scooter road trip, North Goa coastal road"],
    },
    accommodation: { budget: "Zostel Goa, Palolem (₹600 dorm)", mid: "Casa de Goa, Calangute (₹2500)", luxury: "Taj Exotica, Benaulim (₹18000)" },
    weather: { temperature: "28–34°C", condition: "Sunny with sea breeze", rainPrediction: "20% chance (avoid Jun–Sep)", suggestion: "SPF 50 sunscreen, light cotton, beach sandals." },
    transport: "Scooter rental ₹300–400/day (essential). Ola/Uber available. Local buses ₹10–20.",
  },

  manali: {
    region: "mountain",
    areas: ["Old Manali (cafes & hippie vibe)", "Mall Road (main strip)", "Vashisht village", "Solang Valley (14 km)"],
    highlights: [
      "Rohtang Pass (3978 m) — permit required (₹550 online)",
      "Solang Valley — paragliding & snow activities",
      "Hadimba Devi Temple in cedar forest (free)",
      "Old Manali street walk & café culture",
      "Vashisht Hot Springs (₹10 entry)",
      "Jogini Waterfall trek (2 hr from Vashisht)",
      "Naggar Castle & Roerich Art Gallery (25 km)",
      "Beas River views & riverside walks",
    ],
    restaurants: [
      "Café 1947, Old Manali (wood-fired pizza + thukpa ₹200)",
      "Johnson's Café, Mall Road (continental breakfast ₹350)",
      "Drifter's Café, Old Manali (pancakes & smoothies ₹180)",
      "Dylan's Toasted & Roasted, Old Manali (filter coffee ₹100)",
      "Shiva Café, Vashisht (momos with views ₹150)",
      "Chopsticks, Mall Road (Chinese-Tibetan ₹250)",
    ],
    activities: {
      adventure:  ["Paragliding at Solang Valley — tandem (₹2500)", "White-water rafting Beas River, May–Jun (₹600)", "Mountain biking — rent from Mall Road (₹500/day)", "Snow activities at Rohtang, Dec–Mar (₹200–500 each)"],
      mountains:  ["Sunrise hike to Jogini Waterfall (2 hrs, free)", "Beas Kund base camp trek (3 days, guide ₹1500/day)", "Hampta Pass crossing (4 days)", "Vashisht village morning walk (free)"],
      cafes:      ["Old Manali café crawl — Café 1947 → Dylan's → Drifter's", "Bonfire evening at Zostel Manali rooftop", "Riverside café sit-down, Old Manali bridge"],
      culture:    ["Hadimba Devi Temple morning visit", "Naggar Castle heritage tour (₹50 entry)", "Nicholas Roerich Art Gallery, Naggar", "Vashisht hot springs & village life walk"],
    },
    accommodation: { budget: "Zostel Manali, Old Manali (₹550 dorm)", mid: "Snow Valley Resorts (₹2800)", luxury: "Span Resort & Spa (₹9000)" },
    weather: { temperature: "5–18°C (May–Oct) / −10 to 5°C (Nov–Apr)", condition: "Cool, crisp, clear skies", rainPrediction: "25% chance; heavy Jul–Sep", suggestion: "Thermal layers, waterproof jacket, trekking boots non-negotiable." },
    transport: "Local taxis from Mall Road (govt fixed rates). Bike rental ₹150/hr. No Ola/Uber.",
  },

  kerala: {
    region: "coastal",
    areas: ["Fort Kochi / Mattancherry", "Alleppey (backwaters)", "Munnar (hill station)", "Varkala (cliff beach)", "Thekkady / Periyar"],
    highlights: [
      "Alleppey houseboat overnight backwater cruise",
      "Munnar tea estates & Tea Museum",
      "Fort Kochi Chinese fishing nets & heritage walk",
      "Periyar Wildlife Sanctuary, Thekkady",
      "Varkala cliff beach & natural spring",
      "Athirapally Waterfalls (60 km from Kochi)",
      "Mattancherry Palace (Dutch Palace) & Paradesi Synagogue",
      "Kalaripayattu martial arts demo, Fort Kochi",
    ],
    restaurants: [
      "Dhe Puttu, Kochi (puttu & appam ₹150)",
      "Dal Roti, Fort Kochi (budget Kerala homestyle ₹120)",
      "Oceanos, Fort Kochi (seafood ₹600)",
      "Kashi Art Café, Fort Kochi (breakfast & gallery ₹300)",
      "Paragon Restaurant, Kozhikode (legendary biryani ₹250)",
      "Maria's Kitchen, Alleppey (sadhya on banana leaf ₹300)",
    ],
    activities: {
      nature:   ["Alleppey houseboat overnight (₹8000–12000 for 2)", "Periyar boat safari — elephants & gaur (₹200)", "Bamboo rafting Periyar (₹1000)", "Athirapally Waterfalls half-day trip"],
      culture:  ["Fort Kochi heritage walk — Chinese nets, Synagogue, Dutch Palace (free)", "Kathakali dance show, 7 PM Fort Kochi (₹350)", "Kalaripayattu demo, CNK Kalari (₹300)", "Kerala cooking class, Fort Kochi (₹1500)"],
      beaches:  ["Varkala cliff beach walk & natural spring dip", "Cherai Beach day trip from Kochi (30 km, quiet)", "Kovalam lighthouse beach, Trivandrum"],
      wellness: ["Ayurvedic full-body massage 90 min (₹2000)", "Sunrise yoga on Varkala cliff", "Munnar tea estate meditation walk (free)"],
    },
    accommodation: { budget: "Zostel Fort Kochi (₹700 dorm)", mid: "Fragrant Nature Backwater Resort (₹5000)", luxury: "Kumarakom Lake Resort (₹22000)" },
    weather: { temperature: "24–33°C", condition: "Humid, lush, coastal breeze", rainPrediction: "55% Jun–Sep monsoon; 20% Oct–Feb", suggestion: "Waterproof sandals, light poncho. Monsoon adds magic." },
    transport: "KSRTC buses ₹20–80 (cheapest). Autos available. Fort Kochi–Ernakulam ferry ₹4.",
  },

  rajasthan: {
    region: "desert",
    areas: ["Jaipur – Pink City", "Jodhpur – Blue City", "Udaipur – City of Lakes", "Jaisalmer – Golden City", "Pushkar"],
    highlights: [
      "Amber Fort, Jaipur (light & sound show ₹100)",
      "Mehrangarh Fort, Jodhpur (India's finest fort)",
      "City Palace & Lake Pichola boat ride, Udaipur",
      "Jaisalmer Fort — living fort inside the city",
      "Sam Sand Dunes camel safari, Jaisalmer",
      "Hawa Mahal & Jantar Mantar (UNESCO), Jaipur",
      "Pushkar Lake & Brahma Temple",
      "Ranthambore tiger safari",
    ],
    restaurants: [
      "LMB – Laxmi Misthan Bhandar, Jaipur (dal baati churma since 1954, ₹350)",
      "Gypsy Restaurant, Jaipur (rooftop Rajasthani thali ₹500)",
      "Mehran Terrace, Jodhpur fort (fort views ₹600)",
      "Janta Sweet Home, Jodhpur (mirchi bada ₹30)",
      "Ambrai Restaurant, Udaipur (lakeside romantic ₹1200 for two)",
      "Trio Restaurant, Jaisalmer (rooftop fort view thali ₹400)",
    ],
    activities: {
      adventure: ["Overnight camel safari Sam Sand Dunes (₹2500 all-in)", "Hot air balloon over Jaipur at sunrise — Skywaltz (₹8000)", "Ranthambore tiger jeep safari (₹3000, book ahead)", "ATV quad biking in sand dunes, Jaisalmer"],
      culture:   ["Amber Fort guided tour + evening light show", "Blue City heritage walk, Brahmpuri area, Jodhpur", "Udaipur City Palace audio tour", "Jaipur block printing workshop, Sanganer (₹800)"],
      shopping:  ["Johari Bazaar, Jaipur — gems & jewellery", "Sadar Bazaar, Jodhpur — textiles & handicrafts", "Jaisalmer fort lanes — camel leather goods", "Tripolia Bazaar, Jaipur — lac bangles"],
      food:      ["Jaipur street food walk, Badi Chaupar (evening)", "Chokhi Dhani folk village dinner, Jaipur (₹900 all-in)", "Dal Baati Churma cooking class, Airbnb Jaipur"],
    },
    accommodation: { budget: "Zostel Jaipur (₹500 dorm)", mid: "Alsisar Haveli, Jaipur (₹4000)", luxury: "Taj Lake Palace, Udaipur (₹30000)" },
    weather: { temperature: "10–32°C (Oct–Mar) / 35–48°C (Apr–Jun)", condition: "Dry and sunny desert air", rainPrediction: "10% Oct–Mar; 40% Jul–Sep", suggestion: "Light cotton, sun hat, SPF. Warm layer for winter nights." },
    transport: "Hire car + driver ₹2000–3000/day (best for multi-city). Autos in cities at fixed govt rates.",
  },

  delhi: {
    region: "urban",
    areas: ["Old Delhi — Chandni Chowk, Red Fort", "New Delhi — India Gate, CP", "South Delhi — Hauz Khas, Mehrauli", "Lutyens' Delhi"],
    highlights: [
      "Red Fort (Lal Qila, ₹35) — light & sound show evenings",
      "Qutub Minar complex (UNESCO, ₹40)",
      "Humayun's Tomb (UNESCO, ₹40)",
      "Jama Masjid — Friday prayers (free, largest mosque India)",
      "Chandni Chowk food & spice market lanes",
      "India Gate & Rajpath (free, evening stroll)",
      "Lotus Temple (free, stunning Bahá'í architecture)",
      "Hauz Khas Village — ruins, lake, cafes",
    ],
    restaurants: [
      "Karim's, Old Delhi near Jama Masjid (mutton korma since 1913, ₹400)",
      "Paranthe Wali Gali, Old Delhi (stuffed paranthas ₹80)",
      "Moti Mahal, Daryaganj (butter chicken birthplace ₹600)",
      "Saravana Bhavan, Connaught Place (South Indian ₹300)",
      "Gulati, Pandara Road (Mughlai open late ₹700)",
      "Natraj Dahi Bhalla Wala, Chandni Chowk (street icon ₹60)",
    ],
    activities: {
      culture:   ["Old Delhi food walk — Chandni Chowk lanes (₹1500 guided)", "Heritage cycle tour of Lutyens' Delhi — Pedal Yatri (₹1200)", "Red Fort light & sound show (₹80)", "Dilli Haat craft market INA (₹30 entry)"],
      shopping:  ["Chandni Chowk wholesale bazaar — fabric & spices", "Sarojini Nagar fashion market (cheapest clothes)", "Janpath Lane & Tibetan Market — souvenirs ₹50–500", "Dilli Haat INA — crafts from all Indian states"],
      food:      ["Chandni Chowk street food walk — jalebi, chole bhature, paranthe", "Hauz Khas Village café-hop (evening)", "Karim's Old Delhi lunch experience"],
      history:   ["Qutub Minar at sunrise (no crowds)", "Humayun's Tomb + Isa Khan's Tomb guided tour", "National Museum, Janpath (₹20)", "Purana Qila (Old Fort) ₹20"],
      nightlife: ["Hauz Khas Social — rooftop bar, lake views", "Cyber Hub Gurgaon — 50+ bars & restaurants (30 min metro)", "Khan Market wine bar strip"],
    },
    accommodation: { budget: "Zostel Delhi, Paharganj (₹600 dorm)", mid: "The Park, Connaught Place (₹6500)", luxury: "The Imperial (₹25000)" },
    weather: { temperature: "8–25°C (Oct–Feb) / 38–48°C (May–Jun)", condition: "Sunny Oct–Mar; extreme heat Apr–Jun", rainPrediction: "5% Oct–Mar; 60% Jul–Sep monsoon", suggestion: "Oct–Mar: light layers. Apr–Jun: full sun protection, 12–4 PM indoors." },
    transport: "Delhi Metro Day Pass ₹150 (fastest). Uber/Ola everywhere. Autos via Rapido app.",
  },

  mumbai: {
    region: "coastal",
    areas: ["South Mumbai — Colaba, Fort, Marine Drive", "Bandra — cafes, boutiques, nightlife", "Juhu — beach & Bollywood", "Lower Parel — rooftop bars, malls"],
    highlights: [
      "Gateway of India (free) + Elephanta Caves UNESCO (boat ₹240)",
      "Marine Drive at night — Queen's Necklace",
      "CST Station (UNESCO, exterior photography)",
      "Dharavi slum tour — Reality Tours (₹850)",
      "Haji Ali Dargah (tidal island, free)",
      "Siddhi Vinayak Temple (5:30 AM, no queue)",
      "Crawford Market — Mahatma Phule Market",
      "Juhu Beach — dawn bhajia breakfast",
    ],
    restaurants: [
      "Leopold Café, Colaba (continental since 1871, ₹600)",
      "Britannia & Co., Ballard Estate (Berry Pulao, Parsi, ₹500)",
      "Trishna, Fort (butter pepper garlic crab ₹1500)",
      "Bade Miya, Colaba (seekh kababs street stall ₹200)",
      "Mahesh Lunch Home, Fort (Mangalorean seafood ₹800)",
      "Lucky Restaurant, Bandra (Mughlai biryani ₹400)",
    ],
    activities: {
      culture:   ["Dharavi slum tour — Reality Tours half-day (₹850)", "Heritage walk Fort precinct — Gothic architecture (free)", "Elephanta Caves UNESCO boat trip (₹240 ferry + ₹40 entry)", "Dr Bhau Daji Lad Museum, Byculla (finest museum Mumbai)"],
      food:      ["Mahim street food walk — vada pav, bhel, pani puri", "Colaba Causeway café-hop + Leopold lunch", "Juhu Beach bhajia at dawn (₹30/plate)", "Crawford Market spice & dry fruit shopping"],
      nightlife: ["Aer Bar, Four Seasons Worli — 34th floor cocktails", "Anti-Social, Bandra — indie music nights", "Gateway of India late-night ferry view + Colaba kababs"],
      beaches:   ["Juhu Beach sunrise walk", "Versova Beach (quiet, north Mumbai)", "Girgaon Chowpatty bhelpuri at dusk (₹50)"],
      shopping:  ["Colaba Causeway — clothes, art, antiques", "Linking Road, Bandra — street fashion", "Kalaghoda Art District — galleries & boutiques"],
    },
    accommodation: { budget: "Zostel Mumbai, Colaba (₹700 dorm)", mid: "Gordon House Hotel, Colaba (₹5000)", luxury: "Taj Mahal Palace, Colaba (₹30000)" },
    weather: { temperature: "25–35°C (Oct–Feb) / 28–38°C (Mar–May)", condition: "Humid coastal, sea breeze", rainPrediction: "70% Jun–Sep; 10% Oct–Feb", suggestion: "Light cotton always. Umbrella Jun–Sep. Comfy walking shoes essential." },
    transport: "Local train ₹10–30 (fastest, avoid 9–11 AM & 6–9 PM rush). Uber/Ola everywhere. Ferry ₹240 Gateway → Elephanta.",
  },

  bali: {
    region: "island",
    areas: ["Seminyak & Kuta (beach, nightlife)", "Ubud (culture, rice terraces)", "Canggu (surf, hipster cafes)", "Uluwatu (cliffs, surf)", "Nusa Dua (luxury)"],
    highlights: [
      "Tegallalang Rice Terraces, Ubud (sunrise 6 AM)",
      "Tanah Lot Temple at sunset (iconic)",
      "Sacred Monkey Forest Sanctuary, Ubud",
      "Uluwatu Cliff Temple + Kecak fire dance 6 PM",
      "Tirta Empul Holy Spring purification ritual",
      "Mount Batur sunrise trek (4 AM start)",
      "Nusa Penida day trip — Kelingking Beach + manta snorkel",
      "Seminyak sunset beach clubs",
    ],
    restaurants: [
      "Locavore, Ubud (farm-to-table fine dining, book 3 weeks ahead)",
      "Ibu Oka, Ubud (babi guling institution, lunch only, ₹1200)",
      "Naughty Nuri's, Ubud (fall-off-bone ribs, ₹1600)",
      "Single Fin, Uluwatu (sunset drinks + burgers, ₹1500)",
      "Crate Café, Canggu (best breakfast bowls, ₹1200)",
      "Mama San, Seminyak (Southeast Asian tapas, ₹2000)",
    ],
    activities: {
      adventure: ["Mount Batur sunrise trek (₹1500 all-in guide, 5 hrs)", "Ayung River white-water rafting (₹1200, 2 hrs)", "Scuba diving Amed or Nusa Penida (₹2500)", "Surf lesson Batu Bolong, Canggu (₹800, 2 hrs)"],
      culture:   ["Ubud market tour + cooking class (₹2000, full day)", "Kecak fire dance Uluwatu (₹800 via GetYourGuide)", "Balinese batik painting class (₹600)", "Tirta Empul purification ritual walk"],
      nature:    ["Nusa Penida day trip — Kelingking, Angel Billabong, manta rays (₹1500)", "Tegallalang Rice Terraces sunrise walk (₹500 IDR entry)", "Munduk waterfall trek north Bali", "Ubud rice terrace cycling (₹500)"],
      beaches:   ["Seminyak Beach sunset walk + beach club drinks", "Balangan Beach — uncrowded, cliff backdrop", "Jimbaran Bay sunset seafood BBQ on beach", "Padang Padang surf beach (₹30k IDR entry)"],
      wellness:  ["Yoga Barn, Ubud — drop-in class (₹1200)", "Traditional Balinese massage 60 min (₹600, any warung)", "Ubud spa day — scrub + wrap + massage (₹2500)"],
    },
    accommodation: { budget: "Lumbung Sari Hostel, Ubud (₹800 dorm)", mid: "Alaya Resort Ubud (₹4500)", luxury: "Four Seasons Jimbaran Bay (₹30000)" },
    weather: { temperature: "27–34°C year-round", condition: "Tropical, warm, humid", rainPrediction: "35% Apr–Sep; 60% Oct–Mar afternoons", suggestion: "SPF 50, light cottons, sarong for temples, compact umbrella, reef-safe sunscreen for diving." },
    transport: "Scooter rental ₹200–300/day (essential). Grab app (SE Asia Uber). Blue Bird metered taxis from airport.",
  },

  paris: {
    region: "european",
    areas: ["1st–4th arr. (Louvre, Marais, Notre-Dame)", "5th–6th arr. (Latin Quarter, Saint-Germain)", "8th arr. (Champs-Élysées, Arc de Triomphe)", "18th arr. (Montmartre, Sacré-Cœur)", "10th–11th arr. (Canal Saint-Martin, hip bars)"],
    highlights: [
      "Eiffel Tower — book summit online, go at dusk (€29)",
      "Louvre Museum — pre-book skip-the-line (€17, half day)",
      "Musée d'Orsay — Impressionists Monet & Van Gogh (€16)",
      "Montmartre & Sacré-Cœur (free, cobblestone village)",
      "Sainte-Chapelle stained glass (book ahead, €13)",
      "Versailles day trip — palace & gardens (€20 + €10 train)",
      "Centre Pompidou modern art (€14)",
      "Marché des Enfants Rouges — oldest covered market (free)",
    ],
    restaurants: [
      "Chez L'Ami Jean, 7th arr. (Basque cuisine, book 2 weeks, €50/person)",
      "Septime, 11th arr. (neo-bistro icon, book 3 weeks, €80)",
      "Café de Flore, 6th arr. (literary institution since 1887, €15 coffee+croissant)",
      "L'As du Fallafel, Marais (best falafel Paris, queue, €7)",
      "Berthillon, Île Saint-Louis (legendary ice cream since 1954, €4/scoop)",
      "Ladurée, 8th arr. (original macaron house 1862, €3 each)",
    ],
    activities: {
      culture:   ["Louvre 3-hour guided tour — skip-the-line (€40)", "Musée d'Orsay self-guided with audio (€6 audio)", "Versailles palace + gardens full day", "Père Lachaise cemetery walk (free, map essential)"],
      food:      ["Paris food market — Marché Bastille (Thu/Sun, free to browse)", "Croissant baking class at Cuisine du Chef (€90)", "Canal Saint-Martin picnic with boulangerie haul", "Marché des Enfants Rouges brunch (oldest market 1615)"],
      nightlife: ["Moulin Rouge dinner show (book 1 month ahead, €180)", "Caveau de la Huchette jazz club, Latin Quarter (€15, since 1946)", "Terrass Hotel Montmartre rooftop bar (city views + cocktails)", "Canal Saint-Martin bar walk, 10th arr. (from 9 PM)"],
      shopping:  ["Le Marais vintage & designer boutiques", "Galeries Lafayette, 9th arr. (luxury department store)", "Marché aux Puces de Saint-Ouen flea market (weekends)", "Rue du Faubourg Saint-Honoré — Hermès, Chanel, Dior"],
    },
    accommodation: { budget: "Generator Paris, 10th arr. (₹1500 dorm)", mid: "Hôtel Atmosphères, 5th arr. (₹8000)", luxury: "Le Meurice, 1st arr. (₹45000)" },
    weather: { temperature: "15–22°C (Apr–Jun, Sep–Oct) / 5–10°C (Nov–Mar)", condition: "Mild, overcast, occasional light rain", rainPrediction: "40–55% year-round", suggestion: "Packable rain jacket + comfortable walking shoes. Layers always." },
    transport: "Navigo Easy card (€15 deposit refundable, unlimited metro). Walk as much as possible — Paris is a walking city.",
  },

  tokyo: {
    region: "asian",
    areas: ["Shinjuku (neon, nightlife)", "Shibuya (shopping, crossing)", "Asakusa (Senso-ji, old Tokyo)", "Harajuku (fashion)", "Akihabara (anime, tech)", "Ginza (luxury)"],
    highlights: [
      "Senso-ji Temple, Asakusa (arrive 5 AM, before crowds, free)",
      "Shibuya Crossing — rush hour 8–9 AM or 6–8 PM",
      "teamLab Borderless or Planets digital art (book 2 weeks)",
      "Meiji Jingu Shrine, Harajuku (forest walk, free)",
      "Tokyo Skytree 634 m observation deck (¥2100)",
      "Tsukiji Outer Market — breakfast sushi by 8 AM",
      "Shinjuku Gyoen garden (¥500, cherry blossom Mar–Apr)",
      "Akihabara Electronics & Anime district",
    ],
    restaurants: [
      "Ichiran Ramen, any branch (solo booth tonkotsu, 24 hr, ¥1000)",
      "Sushi Dai, Tsukiji Outer Market (1 hr queue omakase ¥4000 — worth it)",
      "Afuri, Harajuku (yuzu shio ramen ¥1200)",
      "Gonpachi Nishiazabu (Kill Bill izakaya, yakitori ¥3000)",
      "Katsukura, Shinjuku Isetan (tonkatsu perfection ¥1800)",
      "Kagari, Ginza (chicken paitan ramen, always a queue, ¥1100)",
    ],
    activities: {
      culture:   ["Senso-ji Temple + Nakamise shopping street morning (free)", "teamLab Planets digital art (¥3300, book online)", "Meiji Jingu Shrine forest walk + sake barrel corridor (free)", "Harajuku Takeshita Street — kawaii fashion & crêpes"],
      food:      ["Tsukiji Outer Market sushi breakfast walk (8 AM)", "Shinjuku Golden Gai bar-hop — 50+ tiny bars from 6 PM (¥1000/bar)", "Omoide Yokocho smoky yakitori alley, Shinjuku", "Don Quijote discount megastore (open 24 hr)"],
      nightlife: ["Shinjuku Golden Gai authentic tiny bars", "Roppongi Hills Art Night — 3 major museums", "Bar Benfiddich, Shinjuku (award-winning cocktails)", "Robot Restaurant Shinjuku (tourist spectacle, ₹8000)"],
      shopping:  ["Akihabara electronics & anime afternoon", "Harajuku & Omotesando fashion boutiques", "Ginza window shopping & luxury", "Don Quijote discount everything, 24 hr"],
      nature:    ["Shinjuku Gyoen garden (cherry blossom or autumn, ¥500)", "Yanaka old neighbourhood walk (pre-WWII Tokyo feel, free)", "Day trip Nikko UNESCO shrines (2 hr Tobu train)", "Day trip Kamakura Giant Buddha (1 hr JR, ¥700)"],
    },
    accommodation: { budget: "Khaosan Tokyo Kabuki, Asakusa (₹1500 dorm)", mid: "Park Hotel Tokyo, Shiodome (₹9000)", luxury: "Aman Tokyo (₹65000)" },
    weather: { temperature: "15–25°C (Mar–Jun, Sep–Nov) / 28–35°C (Jul–Aug) / 3–12°C (Dec–Feb)", condition: "Mostly clear. Cherry blossom Mar–Apr. Humid Jul–Aug.", rainPrediction: "25% year-round; June rainy season", suggestion: "Layers + IC card for metro. Google Translate camera for menus." },
    transport: "Suica IC card (¥500 deposit, tap metro/JR everywhere). Metro ¥170–310/ride. JapanTaxi app (no Uber).",
  },

  dubai: {
    region: "desert",
    areas: ["Downtown Dubai (Burj Khalifa, Dubai Mall)", "Dubai Marina & JBR (waterfront, beach)", "Old Dubai / Deira (souks, Creek)", "Palm Jumeirah", "DIFC (upscale dining)"],
    highlights: [
      "Burj Khalifa 124th floor (book sunset slot online AED149)",
      "Dubai Mall — aquarium, ice rink, fountain show 6 PM (free show)",
      "Gold Souk & Spice Souk, Deira (free to browse)",
      "Desert safari — dune bashing + BBQ dinner + camel (AED200)",
      "Al Fahidi Historical Neighbourhood (free, wind-tower architecture)",
      "Dubai Frame (AED50)",
      "Abra water taxi across Dubai Creek (AED2, iconic)",
      "Palm Jumeirah monorail + Atlantis view",
    ],
    restaurants: [
      "Al Ustad Special Kabab, Deira (Iranian kebabs since 1978, AED40)",
      "Bu Qtair, Jumeirah Beach (fried fish shack, cash only, AED60 — legendary)",
      "Ravi Restaurant, Satwa (Pakistani dhaba, 24 hr, AED15 — backpacker icon)",
      "Logma, DIFC Mall (Emirati breakfast — chebab + date syrup, AED45)",
      "Pierchic, Al Qasr (overwater seafood, romantic, AED400 for two)",
      "3 Fils, Jumeirah Fishing Harbour (consistently voted best in Dubai)",
    ],
    activities: {
      adventure: ["Desert safari — dune bashing, camel, BBQ under stars (AED200 all-in)", "Skydiving over Palm Jumeirah — iFly Dubai (AED999)", "Ski Dubai indoor slope, Mall of Emirates (AED250)", "Speedboat tour past Atlantis & Burj Al Arab (AED150)"],
      culture:   ["Al Fahidi Historical Neighbourhood self-guided walk (free)", "Abra water taxi across Dubai Creek (AED2)", "Gold Souk + Spice Souk + fabric souk walk, Deira", "Jumeirah Mosque guided tour (AED35, Sat–Thu)"],
      nightlife: ["Soho Garden, Meydan (outdoor festival club)", "White Dubai, Meydan rooftop (open air)", "Nobu Atlantis — dinner then after-party", "Dubai Marina Walk evening stroll + terrace dining"],
      shopping:  ["Dubai Mall (mainstream + luxury)", "Gold Souk — negotiate, buy by gram weight", "Deira City Centre everyday retail", "Dragon Mart wholesale Chinese goods (2 km of shops)"],
      food:      ["Old Dubai street food walk Al Rigga area (shawarma AED5, luqaimat AED3)", "Emirati cooking class (short sessions available)", "Ravi Restaurant cultural dhaba lunch experience"],
    },
    accommodation: { budget: "XVA Art Hotel, Al Fahidi (₹4000)", mid: "Zabeel House by Jumeirah (₹7000)", luxury: "Atlantis The Palm (₹30000)" },
    weather: { temperature: "20–28°C (Nov–Apr) / 35–45°C (May–Oct)", condition: "Desert sun — hot & dry. Nov–Apr perfect.", rainPrediction: "5% year-round", suggestion: "Nov–Apr: light layers for evenings. May–Oct: AC spaces 11 AM–4 PM, outdoors morning/evening only." },
    transport: "Dubai Metro Day Pass AED25 (Red/Green lines cover tourist spots). Taxis metered, reliable. Careem/Uber everywhere.",
  },
};

// ─── Generic fallback for unknown destinations ────────────────────────────────

function makeGenericDestination(destination) {
  return {
    region: "unknown",
    areas: [`${destination} city centre`],
    highlights: [
      `${destination} most popular landmark`,
      `${destination} heritage site`,
      `${destination} local market`,
      `${destination} scenic viewpoint`,
    ],
    restaurants: [
      `Top-rated local restaurant in ${destination}`,
      `Street food market, ${destination}`,
    ],
    activities: {
      culture:  [`Heritage walking tour, ${destination}`, `Museum visit`],
      food:     [`Local street food walk, ${destination}`],
      shopping: [`Main market, ${destination}`],
    },
    accommodation: {
      budget:  `Budget guesthouse (₹800–1200/night)`,
      mid:     `Mid-range hotel (₹2500–5000/night)`,
      luxury:  `Luxury hotel (₹10000+/night)`,
    },
    weather: { temperature: "22–30°C", condition: "Partly cloudy", rainPrediction: "30% chance", suggestion: "Pack a light jacket and compact umbrella." },
    transport: "Local taxis, Ola/Uber, and buses available.",
  };
}

// ─── Packing list builder ─────────────────────────────────────────────────────

function buildPackingList(region, interests, duration) {
  const isBeach    = ["coastal", "island"].includes(region) || interests.includes("beaches");
  const isMountain = region === "mountain" || interests.includes("mountains") || interests.includes("adventure");
  const isCulture  = interests.includes("culture") || interests.includes("history");

  return [
    {
      name: "Clothing",
      items: [
        ...(isBeach    ? ["Swimwear (2 sets)", "Beach cover-up / sarong", "Flip-flops / water sandals"] : []),
        ...(isMountain ? ["Thermal inner layers", "Fleece / down jacket", "Waterproof trekking pants", "Trekking boots"] : []),
        "Light breathable tops (3–4)",
        "Comfortable walking pants / shorts",
        "One smart-casual outfit for dining",
        ...(isCulture  ? ["Modest scarf / cover-up for religious sites"] : []),
        "Comfortable walking shoes / sneakers",
      ],
    },
    {
      name: "Essentials",
      items: [
        "Passport / national ID + photocopies",
        "Travel insurance documents",
        "Credit/debit cards + local cash",
        "Power bank (20,000 mAh)",
        "Universal travel adapter",
        "Reusable water bottle",
        "Basic first-aid kit (paracetamol, antacid, plasters)",
        "Prescription medications",
      ],
    },
    {
      name: "Tech & Accessories",
      items: [
        "Smartphone + charger",
        "Sunglasses (UV400)",
        "Day backpack (20 L)",
        ...(duration > 5 ? ["Packing cubes"] : []),
        "Padlock for lockers",
      ],
    },
    {
      name: "Health & Weather",
      items: [
        ...(isBeach ? ["Sunscreen SPF 50+", "After-sun lotion"] : ["Sunscreen SPF 30"]),
        ...(isMountain ? ["Lip balm SPF", "Hand warmers"] : []),
        "Compact umbrella / rain poncho",
        "Insect repellent",
        "Wet wipes & hand sanitiser",
      ],
    },
  ];
}

// ─── Main fallback builder ────────────────────────────────────────────────────

function buildFallbackItinerary(params) {
  const { destination, budget, duration, interests = [], travelStyle = "balanced" } = params;

  // Match destination
  const key  = destination.toLowerCase().replace(/[^a-z]/g, "");
  const dest = DESTINATIONS[key]
    || Object.entries(DESTINATIONS).find(([k]) => key.includes(k) || k.includes(key.slice(0, 4)))?.[1]
    || makeGenericDestination(destination);

  // Pick accommodation tier
  const perDay   = Math.round(budget / duration);
  const accLabel = perDay < 2500 ? dest.accommodation.budget
                 : perDay < 10000 ? dest.accommodation.mid
                 : dest.accommodation.luxury;

  // Build destination-specific activity pool from interests
  const actPool = interests.flatMap(i => dest.activities?.[i] || []);
  const shuffled = [...new Set(actPool)].sort(() => 0.5 - Math.random());

  // Day-by-day plan
  const itinerary = Array.from({ length: duration }, (_, i) => {
    const day = i + 1;

    if (day === 1) {
      return {
        day,
        title: `Day 1 — Arrival & First Impressions in ${destination}`,
        activities: [
          `Arrive & check in: ${accLabel}`,
          `Orientation walk through ${dest.areas[0]}`,
          `Welcome dinner: ${dest.restaurants[0]}`,
        ],
      };
    }

    if (day === duration) {
      return {
        day,
        title: `Day ${day} — Final Highlights & Departure`,
        activities: [
          `Morning: revisit favourite spot in ${destination} or browse souvenirs`,
          `Last meal: ${dest.restaurants[dest.restaurants.length - 1]}`,
          `Check out & head to airport / station`,
        ],
      };
    }

    const themes = ["Deep Discovery", "Culture & Local Flavours", "Hidden Gems", "Adventure & Experiences", "Slow Travel & Exploration"];
    const highlight = dest.highlights[(i - 1) % dest.highlights.length];
    const act1 = shuffled[(i * 2)     % Math.max(shuffled.length, 1)] || `Explore ${dest.areas[i % dest.areas.length]}`;
    const act2 = shuffled[(i * 2 + 1) % Math.max(shuffled.length, 1)] || `Dinner: ${dest.restaurants[i % dest.restaurants.length]}`;

    return {
      day,
      title: `Day ${day} — ${themes[(day - 2) % themes.length]}`,
      activities: [highlight, act1, act2],
    };
  });

  return {
    overview: { destination, duration, totalBudget: budget, currency: "INR", travelStyle },
    itinerary,
    packing_list: buildPackingList(dest.region, interests, duration),
    weather: dest.weather,
    transportNote: dest.transport,
  };
}

module.exports = { buildFallbackItinerary };
