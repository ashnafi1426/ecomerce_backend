/**
 * SEMANTIC SEARCH QUERY PROCESSOR
 *
 * Converts raw user queries into expanded, intent-aware search parameters.
 * Implements: synonym expansion, stemming, intent detection, brand detection.
 *
 * No external API required — all logic is in-process.
 */

// ─── Synonym / Concept Map ────────────────────────────────────────────────────
// Keys AND their synonyms all map to the same concept cluster.
const SYNONYM_MAP = {
  // ── Electronics ──────────────────────────────────────────────────────────
  phone: ['smartphone', 'mobile', 'cellular', 'handset', 'iphone', 'android', 'cell'],
  smartphone: ['phone', 'mobile', 'iphone', 'android', 'handset'],
  laptop: ['notebook', 'computer', 'macbook', 'ultrabook', 'chromebook', 'pc'],
  computer: ['laptop', 'desktop', 'pc', 'notebook', 'workstation'],
  tablet: ['ipad', 'slate', 'tab', 'android tablet'],
  headphones: ['earphones', 'earbuds', 'headset', 'airpods', 'earpiece', 'audio'],
  earphones: ['headphones', 'earbuds', 'headset', 'airpods'],
  tv: ['television', 'monitor', 'display', 'screen', 'smart tv'],
  television: ['tv', 'monitor', 'display', 'screen'],
  monitor: ['screen', 'display', 'tv', 'television'],
  camera: ['dslr', 'webcam', 'camcorder', 'photography', 'lens'],
  charger: ['adapter', 'cable', 'charging', 'power bank', 'usb'],
  speaker: ['bluetooth speaker', 'soundbar', 'audio', 'subwoofer'],
  watch: ['smartwatch', 'fitness tracker', 'wristband', 'band'],
  smartwatch: ['watch', 'fitness tracker', 'band', 'wearable'],
  keyboard: ['mechanical keyboard', 'gaming keyboard', 'wireless keyboard'],
  mouse: ['gaming mouse', 'wireless mouse', 'trackpad'],
  gaming: ['game', 'gamer', 'esports', 'playstation', 'xbox', 'console'],
  game: ['gaming', 'gamer', 'pc game', 'console game', 'video game'],
  console: ['playstation', 'xbox', 'nintendo', 'gaming console'],

  // ── Clothing & Fashion ───────────────────────────────────────────────────
  shoes: ['sneakers', 'footwear', 'boots', 'trainers', 'loafers', 'sandals', 'heels'],
  sneakers: ['shoes', 'trainers', 'athletic shoes', 'sport shoes', 'kicks'],
  boots: ['shoes', 'footwear', 'ankle boots', 'hiking boots'],
  shirt: ['tshirt', 't-shirt', 'top', 'blouse', 'polo', 'tee'],
  tshirt: ['shirt', 'top', 'tee', 'blouse'],
  pants: ['trousers', 'jeans', 'bottoms', 'leggings', 'chinos'],
  jeans: ['denim', 'pants', 'trousers', 'bottoms'],
  dress: ['gown', 'outfit', 'frock', 'skirt'],
  jacket: ['coat', 'hoodie', 'sweater', 'sweatshirt', 'blazer', 'outerwear'],
  hoodie: ['sweatshirt', 'jacket', 'sweater', 'pullover'],
  bag: ['backpack', 'purse', 'handbag', 'tote', 'satchel', 'luggage'],
  backpack: ['bag', 'rucksack', 'hiking bag', 'school bag'],
  sunglasses: ['glasses', 'shades', 'eyewear'],

  // ── Sports & Fitness ─────────────────────────────────────────────────────
  running: ['jogging', 'marathon', 'athletic', 'sport', 'cardio'],
  gym: ['fitness', 'workout', 'exercise', 'training', 'bodybuilding'],
  fitness: ['gym', 'workout', 'exercise', 'health', 'sport', 'athletic'],
  yoga: ['meditation', 'exercise', 'fitness', 'mat'],
  cycling: ['bicycle', 'bike', 'biking', 'pedal', 'cycle'],
  hiking: ['trekking', 'outdoor', 'trail', 'camping'],
  camping: ['outdoor', 'hiking', 'tent', 'survival', 'trekking'],
  swimming: ['pool', 'aqua', 'water sport', 'swimsuit'],

  // ── Home & Furniture ─────────────────────────────────────────────────────
  furniture: ['sofa', 'chair', 'table', 'desk', 'cabinet', 'shelf'],
  sofa: ['couch', 'settee', 'loveseat', 'furniture', 'chair'],
  desk: ['table', 'workstation', 'furniture', 'office'],
  chair: ['seat', 'stool', 'sofa', 'furniture'],
  kitchen: ['cooking', 'cookware', 'utensils', 'appliance', 'cuisine'],
  cookware: ['pan', 'pot', 'skillet', 'kitchen', 'cooking'],
  bedding: ['mattress', 'pillow', 'sheets', 'blanket', 'duvet', 'quilt'],
  lamp: ['light', 'lighting', 'bulb', 'lantern', 'chandelier'],
  vacuum: ['cleaner', 'hoover', 'cleaning', 'robot vacuum'],
  refrigerator: ['fridge', 'freezer', 'appliance', 'cooler'],
  washing: ['washer', 'laundry', 'machine', 'dryer'],

  // ── Beauty & Personal Care ───────────────────────────────────────────────
  skincare: ['moisturizer', 'serum', 'cream', 'lotion', 'face wash', 'toner'],
  makeup: ['cosmetics', 'lipstick', 'foundation', 'mascara', 'blush', 'eyeshadow'],
  perfume: ['fragrance', 'cologne', 'scent', 'eau de parfum'],
  shampoo: ['hair care', 'conditioner', 'hair wash'],
  supplement: ['vitamin', 'protein', 'nutrition', 'health', 'wellness'],

  // ── Toys & Kids ──────────────────────────────────────────────────────────
  toy: ['kids', 'children', 'play', 'toddler', 'game', 'doll', 'puzzle'],
  doll: ['toy', 'kids', 'play', 'children'],
  puzzle: ['toy', 'game', 'brain', 'jigsaw', 'kids'],

  // ── Books & Stationery ────────────────────────────────────────────────────
  book: ['novel', 'textbook', 'guide', 'reading', 'ebook'],
  pen: ['stationery', 'writing', 'marker', 'pencil'],

  // ── Automotive ────────────────────────────────────────────────────────────
  car: ['automotive', 'vehicle', 'auto', 'automobile'],
  tire: ['wheel', 'tyre', 'automotive', 'rubber'],
};

// ─── Price / Sort Intent Keywords ────────────────────────────────────────────
const CHEAP_KEYWORDS = ['cheap', 'affordable', 'budget', 'inexpensive', 'low cost', 'low-cost',
  'discount', 'deal', 'sale', 'economical', 'value', 'bargain', 'save'];
const PREMIUM_KEYWORDS = ['premium', 'luxury', 'expensive', 'high-end', 'professional', 'pro',
  'elite', 'deluxe', 'exclusive', 'designer', 'top'];
const QUALITY_KEYWORDS = ['best', 'top rated', 'good', 'quality', 'excellent', 'great', 'recommended',
  'popular', 'high quality'];
const NEW_KEYWORDS = ['new', 'latest', 'newest', 'fresh', 'recent', '2024', '2025', '2026'];
const FAST_KEYWORDS = ['fast', 'quick', 'rapid', 'quick charge', 'fast delivery'];

// ─── Intent noise words (remove from product search tokens) ──────────────────
const NOISE_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'in', 'on', 'at', 'to', 'of', 'with',
  'by', 'from', 'is', 'are', 'was', 'my', 'me', 'i', 'want', 'need', 'looking',
  'find', 'get', 'buy', 'show', 'search', 'something', 'like', 'type', 'kind',
  'please', 'can', 'you', 'help', 'good', 'best', 'great', 'nice', 'use',
  'cheap', 'affordable', 'budget', 'inexpensive', 'discount', 'deal', 'sale',
  'premium', 'luxury', 'expensive', 'professional', 'pro', 'elite', 'deluxe',
  'latest', 'new', 'fast', 'quick', 'high', 'low', 'top', 'under',
]);

// ─── Known brand names ────────────────────────────────────────────────────────
const KNOWN_BRANDS = [
  'nike', 'adidas', 'puma', 'reebok', 'under armour', 'new balance', 'vans', 'converse',
  'apple', 'samsung', 'sony', 'lg', 'xiaomi', 'oneplus', 'huawei', 'google', 'motorola',
  'dell', 'hp', 'lenovo', 'asus', 'acer', 'microsoft', 'msi',
  'anker', 'belkin', 'logitech', 'razer', 'corsair', 'steelseries', 'hyperx',
  'amazon', 'bose', 'jbl', 'sennheiser', 'beats', 'skullcandy',
  'zara', 'hm', 'gap', 'levis', 'calvin klein', 'tommy hilfiger', 'ralph lauren',
  'gucci', 'prada', 'chanel', 'versace', 'armani',
  'bosch', 'dyson', 'philips', 'panasonic', 'miele',
  'lego', 'nintendo', 'playstation', 'xbox',
  'ikea', 'walmart',
];

// ─── Simple English Stemmer ───────────────────────────────────────────────────
function stem(word) {
  if (!word || word.length <= 3) return word;
  const w = word.toLowerCase();

  // Ordered rules (most specific first)
  const rules = [
    [/ational$/, 'ate'],
    [/tional$/, 'tion'],
    [/fulness$/, 'ful'],
    [/ousness$/, 'ous'],
    [/iveness$/, 'ive'],
    [/erness$/, 'er'],
    [/nesses$/, ''],
    [/ments$/, ''],
    [/ment$/, ''],
    [/ness$/, ''],
    [/ation$/, 'ate'],
    [/ities$/, 'ity'],
    [/ness$/, ''],
    [/ers$/, ''],
    [/ing$/, ''],
    [/tion$/, ''],
    [/ies$/, 'y'],
    [/ess$/, ''],
    [/ed$/, ''],
    [/er$/, ''],
    [/ly$/, ''],
    [/es$/, ''],
    [/s$/, ''],
  ];

  for (const [pattern, replacement] of rules) {
    const result = w.replace(pattern, replacement);
    if (result !== w && result.length >= 3) return result;
  }
  return w;
}

// ─── Levenshtein Distance (typo tolerance) ────────────────────────────────────
function levenshtein(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

// ─── Main Query Processor ─────────────────────────────────────────────────────
/**
 * Process a raw user query into structured search parameters.
 * @param {string} rawQuery - User's natural language search query
 * @returns {{
 *   cleanQuery: string,
 *   tokens: string[],
 *   expandedTerms: string[],
 *   priceIntent: 'cheap'|'premium'|null,
 *   sortOverride: string|null,
 *   brandHints: string[],
 *   isNewIntent: boolean,
 * }}
 */
function processQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return { cleanQuery: '', tokens: [], expandedTerms: [], priceIntent: null, sortOverride: null, brandHints: [], isNewIntent: false };
  }

  const original = rawQuery.trim();
  const lower = original.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // ── Intent detection ──────────────────────────────────────────────────────
  let priceIntent = null;
  let sortOverride = null;
  let isNewIntent = false;

  if (CHEAP_KEYWORDS.some(w => lower.includes(w))) {
    priceIntent = 'cheap';
    sortOverride = 'price_asc';
  } else if (PREMIUM_KEYWORDS.some(w => lower.includes(w))) {
    priceIntent = 'premium';
    sortOverride = 'price_desc';
  }

  if (QUALITY_KEYWORDS.some(w => lower.includes(w))) {
    sortOverride = sortOverride || 'rating';
  }

  if (NEW_KEYWORDS.some(w => lower.includes(w))) {
    isNewIntent = true;
    sortOverride = sortOverride || 'newest';
  }

  // ── Brand detection ───────────────────────────────────────────────────────
  const brandHints = KNOWN_BRANDS.filter(brand => lower.includes(brand));

  // ── Tokenize (remove noise words) ─────────────────────────────────────────
  const rawTokens = lower.split(/\s+/).filter(t => t.length >= 2);
  const tokens = rawTokens.filter(t => !NOISE_WORDS.has(t));

  // ── Synonym + stem expansion ──────────────────────────────────────────────
  const expandedSet = new Set(tokens);

  for (const token of tokens) {
    // Direct synonym lookup
    if (SYNONYM_MAP[token]) {
      for (const syn of SYNONYM_MAP[token]) {
        syn.split(' ').forEach(w => w.length >= 3 && expandedSet.add(w));
      }
    }

    // Reverse synonym lookup (token appears as a value in SYNONYM_MAP)
    for (const [key, syns] of Object.entries(SYNONYM_MAP)) {
      if (syns.some(s => s === token || s.split(' ').includes(token))) {
        expandedSet.add(key);
        syns.forEach(s => s.split(' ').forEach(w => w.length >= 3 && expandedSet.add(w)));
      }
    }

    // Stemmed form
    const stemmed = stem(token);
    if (stemmed !== token && stemmed.length >= 3) {
      expandedSet.add(stemmed);
    }

    // Typo tolerance: if token is 5+ chars and not in synonym map,
    // add approximate matches from synonym keys within edit distance 1
    if (token.length >= 5 && !SYNONYM_MAP[token]) {
      for (const key of Object.keys(SYNONYM_MAP)) {
        if (Math.abs(key.length - token.length) <= 1 && levenshtein(token, key) <= 1) {
          expandedSet.add(key);
          (SYNONYM_MAP[key] || []).forEach(s => s.split(' ').forEach(w => w.length >= 3 && expandedSet.add(w)));
        }
      }
    }
  }

  // Remove very short or noise terms from expansion
  const expandedTerms = [...expandedSet].filter(t => t.length >= 2 && !NOISE_WORDS.has(t));

  return {
    cleanQuery: tokens.join(' '),
    tokens,
    expandedTerms,
    priceIntent,
    sortOverride,
    brandHints,
    isNewIntent,
  };
}

/**
 * Score a single product's relevance against processed query info.
 * Returns a score 0–200+.
 */
function scoreProduct(product, { tokens, expandedTerms, brandHints }) {
  let score = 0;

  const title = (product.title || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();
  const catName = (product.category?.name || '').toLowerCase();
  const tags = ((product.tags || []).join(' ')).toLowerCase();

  const allTokens = tokens.length > 0 ? tokens : expandedTerms;

  // ── Exact full query match ────────────────────────────────────────────────
  const cleanQuery = allTokens.join(' ');
  if (title === cleanQuery) score += 200;
  else if (title.startsWith(cleanQuery)) score += 160;
  else if (title.includes(cleanQuery)) score += 120;

  // ── Per-token matches ─────────────────────────────────────────────────────
  for (const token of allTokens) {
    if (title.includes(token)) score += 20;
    if (brand.includes(token)) score += 18;
    if (catName.includes(token)) score += 15;
    if (tags.includes(token)) score += 12;
    if (description.includes(token)) score += 6;
  }

  // ── Expanded synonym matches (lower weight) ────────────────────────────────
  const synOnlyTerms = expandedTerms.filter(t => !allTokens.includes(t));
  for (const term of synOnlyTerms) {
    if (title.includes(term)) score += 10;
    if (brand.includes(term)) score += 9;
    if (catName.includes(term)) score += 8;
    if (tags.includes(term)) score += 6;
    if (description.includes(term)) score += 3;
  }

  // ── Brand detection bonus ─────────────────────────────────────────────────
  for (const bHint of brandHints) {
    if (brand.includes(bHint) || title.includes(bHint)) score += 30;
  }

  // ── Quality signals ───────────────────────────────────────────────────────
  const rating = parseFloat(product.average_rating) || 0;
  score += (rating / 5) * 20;                          // up to +20 for 5-star

  if (product.is_featured) score += 15;
  if (product.total_sales) score += Math.min(parseFloat(product.total_sales) / 10, 15); // up to +15

  return score;
}

module.exports = { processQuery, scoreProduct, stem, levenshtein, SYNONYM_MAP };
