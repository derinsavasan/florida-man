// Florida Man Scrollama - Interactive D3 Visualizations
// Using scrollama for scroll-driven storytelling

// ============================================
// DATA PROCESSING
// ============================================

const TROPE_LABELS = {
    weapons: 'Weapons',
    substances: 'Substances',
    animals: 'Animals',
    nudity: 'Nudity'
};

// Cue patterns are boundary-aware to avoid false positives like "catch" -> "cat"
const TROPE_CUE_PATTERNS = {
    animals: [
        'gator(?:s)?',
        'alligator(?:s)?',
        'croc(?:s)?',
        'crocodile(?:s)?',
        'python(?:s)?',
        'cobra(?:s)?',
        'snake(?:s)?',
        'lizard(?:s)?',
        'iguana(?:s)?',
        'frog(?:s)?',
        'toad(?:s)?',
        'turtle(?:s)?',
        'tortoise(?:s)?',
        'shark(?:s)?',
        'dolphin(?:s)?',
        'manatee(?:s)?',
        'dog(?:s)?',
        'cat(?:s)?',
        'horse(?:s)?',
        'pony(?:|s|ies)',
        'donkey(?:s)?',
        'mule(?:s)?',
        'llama(?:s)?',
        'alpaca(?:s)?',
        'bear(?:s)?',
        'cow(?:s)?',
        'cattle',
        'bull(?:s)?',
        'oxen?',
        'pig(?:s)?',
        'hog(?:s)?',
        'boar(?:s)?',
        'goat(?:s)?',
        'sheep',
        'ram(?:s)?',
        'chicken(?:s)?',
        'rooster(?:s)?',
        'animal(?:s)?',
        'critter(?:s)?',
        'wildlife'
    ],
    nudity: [
        'naked',
        'nude',
        'nudity',
        'undressed',
        'unclothed',
        'topless',
        'bottomless',
        'pantsless',
        'pantless',
        'shirtless',
        'bare',
        'flasher(?:s)?',
        'flashing',
        'expos(?:e|ed|es|ing)',
        'streak(?:er|ing)?',
        'indecent\\s+exposure',
        'public\\s+indecency'
    ],
    substances: [
        'beer',
        'booze',
        'alcohol',
        'drunk',
        'drunken',
        'intoxicat(?:ed|ion)',
        'dui',
        'dwi',
        'liquor',
        'whiskey',
        'whisky',
        'vodka',
        'tequila',
        'rum',
        'wine',
        'meth(?:amphetamine)?',
        'cocaine',
        'crack',
        'weed',
        'pot',
        'cannabis',
        'hash',
        'drug(?:s)?',
        'marijuana',
        'heroin',
        'fentanyl',
        'opioid(?:s)?',
        'pill(?:s)?',
        'oxy(?:codone)?',
        'xanax',
        'benzo(?:diazepine)?s?',
        'pcp',
        'lsd',
        'vape(?:s|ing)?',
        'bath\\s+salts',
        'stoned'
    ],
    weapons: [
        'gun(?:s)?',
        'firearm(?:s)?',
        'handgun(?:s)?',
        'knife|knives',
        'weapon(?:s)?',
        'shoot(?:s|ing|er)?',
        'stab(?:s|bed|bing)?',
        'sword(?:s)?',
        'rifle(?:s)?',
        'pistol(?:s)?',
        'shotgun(?:s)?',
        'revolver(?:s)?',
        'ar-?15',
        'ak-?47',
        'bb\\s*gun',
        'pellet\\s*gun',
        'taser(?:s)?',
        'stun\\s*gun',
        'crossbow(?:s)?',
        'bow',
        'arrow(?:s)?',
        'machete(?:s)?',
        'blade(?:s)?',
        'hatchet(?:s)?',
        'axe|ax(?:es)?',
        'hammer(?:s)?',
        'bat(?:s)?',
        'club(?:s)?',
        'crowbar(?:s)?',
        'gunfire',
        'armed'
    ]
};

const TROPE_CLASSES = ['trope-animals', 'trope-nudity', 'trope-substances', 'trope-weapons'];

// Helpers to extract a representative cue for tooltips (aligns with TROPE_CUE_PATTERNS used in Python)
function buildLabelMatchers(patterns) {
    return patterns.map(p => {
        const regex = new RegExp(`\\b(${p})\\b`, 'i');
        return { pattern: p, regex };
    });
}

const TROPE_LABEL_MATCHERS = {
    animals: buildLabelMatchers(TROPE_CUE_PATTERNS.animals),
    nudity: buildLabelMatchers(TROPE_CUE_PATTERNS.nudity),
    substances: buildLabelMatchers(TROPE_CUE_PATTERNS.substances),
    weapons: buildLabelMatchers(TROPE_CUE_PATTERNS.weapons)
};

function extractCueLabel(headline, tropeKey) {
    const matchers = TROPE_LABEL_MATCHERS[tropeKey] || [];
    const text = (headline || '').toLowerCase();
    for (const { regex } of matchers) {
        const m = text.match(regex);
        if (m && m[1]) return m[1].toLowerCase();
    }
    return null;
}

function buildCueRegex(patterns) {
    if (!patterns || !patterns.length) return null;
    // Patterns are preformatted regex fragments (with optional plurals, etc.)
    return new RegExp(`\\b(?:${patterns.join('|')})\\b`, 'i');
}

const TROPE_CUE_REGEX = {
    animals: buildCueRegex(TROPE_CUE_PATTERNS.animals),
    nudity: buildCueRegex(TROPE_CUE_PATTERNS.nudity),
    substances: buildCueRegex(TROPE_CUE_PATTERNS.substances),
    weapons: buildCueRegex(TROPE_CUE_PATTERNS.weapons)
};

// Shared analysis constants (single source of truth for JS)
const WORD_PATTERN = /\b[a-z]{4,}\b/g;
const STOPWORDS = [
    'florida', 'floridaman', 'floridawoman', 'man', 'woman', 'male', 'female',
    'arrested', 'police', 'deputies', 'deputy', 'sheriff', 'officer', 'officers',
    'charged', 'accused', 'allegedly', 'charges', 'facing', 'faces', 'criminal',
    'jail', 'prison', 'court', 'judge', 'sentenced', 'convicted', 'guilty',
    'suspect', 'victim', 'report', 'reports', 'reported', 'officials', 'authorities',
    'says', 'said', 'told', 'tells', 'claims', 'found', 'caught', 'gets', 'tries',
    'tried', 'went', 'goes', 'going', 'came', 'comes', 'coming', 'took', 'takes',
    'made', 'makes', 'making', 'called', 'calls', 'seen', 'video', 'shows',
    'after', 'before', 'during', 'while', 'when', 'where', 'about', 'into',
    'from', 'with', 'without', 'over', 'under', 'through', 'between', 'against',
    'this', 'that', 'these', 'those', 'their', 'them', 'they', 'what', 'which',
    'been', 'being', 'have', 'having', 'does', 'doing', 'done', 'were', 'because',
    'himself', 'herself', 'themselves', 'someone', 'something', 'another', 'other',
    'year', 'years', 'month', 'months', 'week', 'weeks', 'days', 'time', 'times',
    'first', 'second', 'third', 'last', 'next', 'then', 'just', 'still', 'already',
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'more', 'most', 'some', 'many', 'much', 'very', 'also', 'only', 'even', 'back',
    'home', 'away', 'here', 'there', 'down', 'inside', 'outside', 'near', 'later',
    'according', 'incident', 'case', 'local', 'county', 'state', 'area'
];
const STOPWORDS_SET = new Set(STOPWORDS);

const COUNTY_NAMES = [
    'Alachua','Baker','Bay','Bradford','Brevard','Broward','Calhoun','Charlotte','Citrus','Clay','Collier','Columbia','DeSoto','Dixie','Duval','Escambia','Flagler','Franklin','Gadsden','Gilchrist','Glades','Gulf','Hamilton','Hardee','Hendry','Hernando','Highlands','Hillsborough','Holmes','Indian River','Jackson','Jefferson','Lafayette','Lake','Lee','Leon','Levy','Liberty','Madison','Manatee','Marion','Martin','Miami-Dade','Monroe','Nassau','Okaloosa','Okeechobee','Orange','Osceola','Palm Beach','Pasco','Pinellas','Polk','Putnam','Santa Rosa','Sarasota','Seminole','St. Johns','St. Lucie','Sumter','Suwannee','Taylor','Union','Volusia','Wakulla','Walton','Washington'
];

function classifyTropes(d) {
    const normalizeFlag = (val) => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') return val.toLowerCase() === 'true';
        return false;
    };

    const flags = {
        animals: normalizeFlag(d.has_animals),
        nudity: normalizeFlag(d.has_nudity),
        substances: normalizeFlag(d.has_substances),
        weapons: normalizeFlag(d.has_weapons)
    };

    // Always trust scraper-provided labels; no regex fallback to ensure consistency with the notebook pipeline.
    return flags;
}

function getTropesCached(d) {
    if (!d._tropes) d._tropes = classifyTropes(d);
    return d._tropes;
}

// Process the raw data
function processData() {
    const data = {
        total: floridaManData.length,
        tropes: {
            animals: 0,
            nudity: 0,
            substances: 0,
            weapons: 0
        },
        tropeDistribution: {
            0: 0,
            1: 0,
            2: 0,
            3: 0
        },
        locations: {},
        totalWithLocation: 0,
        counties: {},
        words: {},
        byMonth: {},
        samplesCue: {
            animals: [],
            nudity: [],
            substances: [],
            weapons: []
        },
        samplesOther: {
            animals: [],
            nudity: [],
            substances: [],
            weapons: []
        }
    };
    const sampleCountsCue = { animals: 0, nudity: 0, substances: 0, weapons: 0 };
    const sampleCountsOther = { animals: 0, nudity: 0, substances: 0, weapons: 0 };

    const addSample = (key, headline, sourceUrl) => {
        if (!headline) return;
        const matcher = TROPE_CUE_REGEX[key] || null;
        const cueHit = matcher ? matcher.test(headline) : false;

        const addToBucket = (bucket, counts) => {
            counts[key]++;
            if (bucket.length < 6) {
                bucket.push({ headline, sourceUrl, cueHit });
            } else {
                const idx = Math.floor(Math.random() * counts[key]);
                if (idx < bucket.length) {
                    bucket[idx] = { headline, sourceUrl, cueHit };
                }
            }
        };

        if (cueHit) {
            addToBucket(data.samplesCue[key], sampleCountsCue);
        } else {
            addToBucket(data.samplesOther[key], sampleCountsOther);
        }
    };

    floridaManData.forEach(d => {
        // Count tropes
        const tropes = getTropesCached(d);
        let tropeCount = 0;
        if (tropes.animals) {
            data.tropes.animals++;
            tropeCount++;
            addSample('animals', d.headline, d.source_url);
        }
        if (tropes.nudity) {
            data.tropes.nudity++;
            tropeCount++;
            addSample('nudity', d.headline, d.source_url);
        }
        if (tropes.substances) {
            data.tropes.substances++;
            tropeCount++;
            addSample('substances', d.headline, d.source_url);
        }
        if (tropes.weapons) {
            data.tropes.weapons++;
            tropeCount++;
            addSample('weapons', d.headline, d.source_url);
        }

        // Trope distribution
        if (tropeCount >= 3) {
            data.tropeDistribution[3]++;
        } else {
            data.tropeDistribution[tropeCount]++;
        }

        // Locations
        if (d.location_hint && d.location_hint !== 'Florida') {
            data.locations[d.location_hint] = (data.locations[d.location_hint] || 0) + 1;
            data.totalWithLocation++;

            const locLower = d.location_hint.toLowerCase();
            const matchCounty = COUNTY_NAMES.find(c => locLower.includes(c.toLowerCase()));
            if (matchCounty) {
                data.counties[matchCounty] = (data.counties[matchCounty] || 0) + 1;
            }
        }

        // Parse date for timeline
        if (d.date) {
            const date = new Date(d.date);
            if (!isNaN(date)) {
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                data.byMonth[key] = (data.byMonth[key] || 0) + 1;
            }
        }
    });

    return data;
}

function updateTropeSamples(data, key) {
    if (!key || (!data.samplesCue && !data.samplesOther)) return;
    const listEl = document.getElementById('trope-samples-list');
    const titleEl = document.getElementById('trope-samples-title');
    const panelEl = document.getElementById('trope-samples');
    if (!listEl || !titleEl) return;

    const label = TROPE_LABELS[key] || key;
    titleEl.innerHTML = `<strong>${label}</strong>`;
    if (panelEl) {
        panelEl.classList.remove(...TROPE_CLASSES);
        panelEl.classList.add(`trope-${key}`);
        panelEl.classList.remove('hidden');
    }

    listEl.innerHTML = '';
    const cues = data.samplesCue[key] || [];
    const items = cues.slice(0, 3);
    if (!items.length) {
        const li = document.createElement('li');
        li.textContent = 'No clear keyword matches found yet.';
        listEl.appendChild(li);
        return;
    }

    items.forEach(item => {
        const li = document.createElement('li');
        const matcher = TROPE_CUE_REGEX[key] || null;
        if (matcher && matcher.test(item.headline)) {
            const match = item.headline.match(matcher);
            const start = match.index;
            const end = start + match[0].length;
            const before = item.headline.slice(0, start);
            const cue = item.headline.slice(start, end);
            const after = item.headline.slice(end);
            if (before) li.appendChild(document.createTextNode(before));
            const span = document.createElement('span');
            span.className = 'cue';
            span.textContent = cue;
            li.appendChild(span);
            if (after) li.appendChild(document.createTextNode(after));
        } else {
            li.textContent = item.headline;
        }
        listEl.appendChild(li);
    });
}
window.setTropeSamples = updateTropeSamples;
window.resetTropeSamples = function resetTropeSamples() {
    const listEl = document.getElementById('trope-samples-list');
    const titleEl = document.getElementById('trope-samples-title');
    const panelEl = document.getElementById('trope-samples');
    if (panelEl) panelEl.classList.add('hidden');
    if (titleEl) titleEl.innerHTML = '';
    if (listEl) listEl.innerHTML = '';
};

function updateTropeText(data) {
    const total = data.total || 1;
    const t = data.tropes || {};
    const fmt = (n) => n.toLocaleString();
    const pct = (n) => ((n / total) * 100).toFixed(1) + '%';
    const arr = Object.keys(TROPE_LABELS).map(k => ({ key: k, label: TROPE_LABELS[k], count: t[k] || 0, pct: pct(t[k] || 0) }));
    arr.sort((a,b)=>b.count - a.count);
    const [first, second, third, fourth] = arr;
    const narrative = first
        ? `<strong>${first.label}</strong> dominate the headlines, appearing in <strong>${fmt(first.count)}</strong> stories. ${second ? `${second.label}` : ''}${second && third ? ', followed by' : ''} ${third ? `${third.label.toLowerCase()}` : ''}${third && fourth ? ' and ' : ''}${fourth ? `${fourth.label.toLowerCase()}` : ''}. Hover over a specific category to see some example headlines.`
        : '';
    const el = document.getElementById('trope-narrative');
    if (el) el.innerHTML = narrative || 'Trope breakdown updates when data loads.';

    // Do not show samples until user interacts
}

function updateDistributionText(data) {
    const total = data.total || 1;
    const zero = data.tropeDistribution ? data.tropeDistribution[0] || 0 : 0;
    const withTrope = total - zero;
    const pctWith = ((withTrope / total) * 100).toFixed(1);
    const narrativeEl = document.getElementById('distribution-narrative');
    if (narrativeEl) {
        narrativeEl.innerHTML = `If you did some math along the way, you'll realize that the headlines we've looked at so far don't add up to the ${total.toLocaleString()} grand total.<br><br>That's because headlines including any number of tropes (one or more) add up to only ${pctWith}% of the data. This means <strong>${zero.toLocaleString()} stories don't include any tropes at all.</strong>`;
    }
}

// Update the "Pure" section with live share and a random sample of headlines
function updatePureSection(data) {
    const total = data.total || 1;
    const zero = data.tropeDistribution ? data.tropeDistribution[0] || 0 : 0;
    const pctWithout = ((zero / total) * 100).toFixed(1);

    const shareEl = document.getElementById('pure-share');
    if (shareEl) {
        shareEl.textContent = `${pctWithout}%`;
    }

    const favoritesEl = document.querySelector('#viz-pure .favorites');
    if (!favoritesEl) return;

    const favorites = [
        'Florida woman assaults TSA agent after fellow passenger accidentally takes her laptop',
        'Florida Man gets trapped under a lawnmower in pond, dies',
        'Police: Florida man claims he\'s Jesus, kisses a minor in gym locker room',
        'Florida Woman thought to have stuffed 93 year-old dead Mom in freezer',
        'Florida man charged with hate crimes for "racially-motivated" attack against Black driver',
        'Florida Man tries to steal chainsaw by sticking it down his pants',
        'Florida woman backing pickup out of driveway hits gas instead of brake, plows into house across the street -- all the way into the house'
    ];

    // Only consider headlines with zero tropes, keep source URLs for linking
    const purePool = floridaManData
        .filter(d => {
            const tropes = getTropesCached(d);
            return !(tropes.animals || tropes.nudity || tropes.substances || tropes.weapons);
        })
        .map(d => ({
            headline: (d.headline || '').trim(),
            url: d.source_url || ''
        }))
        .filter(d => d.headline);

    const pickRandomObjects = (arr, n) => arr
        .map((obj, i) => ({ obj, r: Math.random(), i }))
        .sort((a, b) => a.r - b.r)
        .slice(0, n)
        .map(p => p.obj);

    // Favorites that are actually present in the pure pool
    const pureFavorites = favorites
        .map(fav => purePool.find(d => d.headline === fav.trim()))
        .filter(Boolean);
    const selectedFavorites = pickRandomObjects(pureFavorites, Math.min(2, pureFavorites.length));

    const usedHeadlines = new Set(selectedFavorites.map(d => d.headline));
    const pureRandomPool = purePool.filter(d => !usedHeadlines.has(d.headline));
    const selectedRandoms = pickRandomObjects(pureRandomPool, Math.min(3, pureRandomPool.length));

    const picks = [...selectedFavorites, ...selectedRandoms].slice(0, 5);

    favoritesEl.innerHTML = '';
    picks.forEach(item => {
        const li = document.createElement('li');
        if (item.url) {
            const a = document.createElement('a');
            a.href = item.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'pure-link';
            a.textContent = item.headline;
            li.appendChild(a);
        } else {
            li.textContent = item.headline;
        }
        favoritesEl.appendChild(li);
    });
}

// ============================================
// CHART CONFIGURATIONS
// ============================================

// Florida palette with distinct trope colors
const colors = {
    // Trope colors - Florida-themed, complementing green palette
    animals: '#e76f51',      // coral orange - wildlife, flamingo
    nudity: '#e9c46a',       // golden yellow - Florida sunshine
    substances: '#264653',   // deep sea teal - coastal waters
    weapons: '#b5395e',      // hibiscus pink-red - tropical danger
    
    // General palette
    orange: ['#95d5b2', '#52b788', '#40916c', '#2d6a4f'],  // green gradient light to dark
    teal: '#40916c'
};

const margin = { top: 40, right: 40, bottom: 60, left: 80 };

// ============================================
// CHART FUNCTIONS
// ============================================

// Track animation state for trope chart
let tropeChartAnimated = false;
let combosChartAnimated = false;
let distributionChartAnimated = false;
let wordsChartAnimated = false;
let geographyChartAnimated = false;
let timelineChartAnimated = false;

function createTropeBarChart(data) {
    const svg = d3.select('#chart-tropes');
    const container = svg.node().parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    const chartData = [
        { key: 'weapons', name: 'Weapons', value: data.tropes.weapons, color: colors.weapons },
        { key: 'substances', name: 'Substances', value: data.tropes.substances, color: colors.substances },
        { key: 'animals', name: 'Animals', value: data.tropes.animals, color: colors.animals },
        { key: 'nudity', name: 'Nudity', value: data.tropes.nudity, color: colors.nudity }
    ].sort((a, b) => b.value - a.value);

    const x = d3.scaleBand()
        .domain(chartData.map(d => d.name))
        .range([margin.left, width - margin.right])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.value) * 1.1])
        .range([height - margin.bottom, margin.top]);

    // Bars - start at 0 height
    svg.selectAll('.bar')
        .data(chartData)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.name))
        .attr('y', y(0))
        .attr('width', x.bandwidth())
        .attr('height', 0)
        .attr('fill', d => d.color)
        .attr('rx', 6)
        .attr('tabindex', 0)
        .on('mouseenter focus', (event, d) => {
            if (window.setTropeSamples) window.setTropeSamples(data, d.key);
        });

    // Hide samples when leaving the chart area or unfocusing bars
    svg.on('mouseleave', () => {
        if (window.resetTropeSamples) window.resetTropeSamples();
    });
    svg.on('focusout', (event) => {
        const related = event.relatedTarget;
        if (!svg.node().contains(related)) {
            if (window.resetTropeSamples) window.resetTropeSamples();
        }
    });

    // Value labels - start at 0
    svg.selectAll('.value-label')
        .data(chartData)
        .join('text')
        .attr('class', 'value-label')
        .attr('x', d => x(d.name) + x.bandwidth() / 2)
        .attr('y', y(0) - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .attr('fill', '#1d1d1f')
        .text('0');

    // X axis
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('font-size', '13px')
        .attr('font-weight', '500');

    // Title
    svg.append('text')
        .attr('class', 'chart-title')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .text('Headlines by Trope Category');

    // Store animation functions globally
    window.animateTropeChart = function() {
        if (tropeChartAnimated) return;
        tropeChartAnimated = true;

        const duration = 3500;

        // Animate bars growing
        svg.selectAll('.bar')
            .transition()
            .duration(duration)
            .ease(d3.easeQuadOut)
            .attr('y', d => y(d.value))
            .attr('height', d => y(0) - y(d.value));

        // Animate value labels - position and count up
        svg.selectAll('.value-label')
            .each(function(d) {
                const label = d3.select(this);
                const targetValue = d.value;
                
                // Animate position
                label.transition()
                    .duration(duration)
                    .ease(d3.easeQuadOut)
                    .attr('y', y(d.value) - 10)
                    .tween('text', function() {
                        const interpolator = d3.interpolateNumber(0, targetValue);
                        return function(t) {
                            label.text(Math.round(interpolator(t)).toLocaleString());
                        };
                    });
            });
    };

    window.resetTropeChart = function() {
        if (!tropeChartAnimated) return;
        tropeChartAnimated = false;

        // Reset bars to 0 height
        svg.selectAll('.bar')
            .transition()
            .duration(300)
            .attr('y', y(0))
            .attr('height', 0);

        // Reset labels to 0
        svg.selectAll('.value-label')
            .transition()
            .duration(300)
            .attr('y', y(0) - 10)
            .text('0');
    };
}

function createDistributionChart(data) {
    const svg = d3.select('#chart-distribution');
    if (svg.empty() || !svg.node()) return;
    const container = svg.node().parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    const chartData = [
        { name: 'No tropes', value: data.tropeDistribution[0] },
        { name: 'One trope', value: data.tropeDistribution[1] },
        { name: 'Two tropes', value: data.tropeDistribution[2] },
        { name: 'Three+ tropes', value: data.tropeDistribution[3] }
    ];

    const total = d3.sum(chartData, d => d.value);
    const radius = Math.min(width, height) / 2 - 60;
    const centerX = width / 2;
    const centerY = height / 2;

    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius);
    const arcHover = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius + 14);

    const g = svg.append('g')
        .attr('transform', `translate(${centerX},${centerY})`);

    // Center text (total)
    const centerValue = g.append('text')
        .attr('class', 'center-value')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.5em')
        .style('font-size', '2rem')
        .style('font-weight', '700')
        .text(total.toLocaleString());

    const centerLabel = g.append('text')
        .attr('class', 'center-label')
        .attr('text-anchor', 'middle')
        .attr('dy', '1em')
        .style('font-size', '0.9rem')
        .style('fill', '#86868b')
        .text('total stories');

    const defaultCenter = () => {
        centerValue.text(total.toLocaleString());
        centerLabel.text('total stories');
    };

    const pieData = pie(chartData);
    // Keep the earlier green gradient (named orange in palette)
    const palette = colors.orange || ['#95d5b2', '#52b788', '#40916c', '#2d6a4f'];
    const colorForIndex = (i) => palette[Math.min(i, palette.length - 1)];

    const translateFor = () => 'translate(0,0)';

    const slices = g.selectAll('.slice')
        .data(pieData)
        .join('path')
        .attr('class', 'slice')
        .attr('fill', (d, i) => colorForIndex(i))
        .attr('stroke', 'none')
        // start collapsed for animation
        .attr('d', d => arc({ startAngle: d.startAngle, endAngle: d.startAngle }))
        .attr('transform', d => translateFor(d));

    slices
        .on('mouseenter', function(event, d) {
            const pct = total ? ((d.data.value / total) * 100).toFixed(1) + '%' : '0%';
            centerValue.text(d.data.value.toLocaleString());
            centerLabel.text(`${d.data.name} (${pct})`);
            d3.select(this)
                .raise()
                .transition()
                .duration(250)
                .attr('d', arcHover)
                .attr('transform', translateFor(d, 8));
        })
        .on('mouseleave', function(event, d) {
            defaultCenter();
            d3.select(this)
                .transition()
                .duration(250)
                .attr('d', arc)
                .attr('transform', translateFor(d));
        });

    // Legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 150}, 40)`);

    chartData.forEach((d, i) => {
        const pct = total ? ((d.value / total) * 100).toFixed(1) : '0.0';
        const lg = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);
        
        lg.append('rect')
            .attr('width', 16)
            .attr('height', 16)
            .attr('fill', colorForIndex(i))
            .attr('rx', 3);
        
        lg.append('text')
            .attr('x', 24)
            .attr('y', 12)
            .attr('font-size', '12px')
            .attr('fill', '#515154')
            .text(`${d.name} (${pct}%)`);
    });

    // Title
    svg.append('text')
        .attr('class', 'chart-title')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .text('Stories by Number of Tropes');

    // Animation hooks
    window.animateDistributionChart = function() {
        if (distributionChartAnimated) return;
        distributionChartAnimated = true;
        slices
            .transition()
            .delay((_, i) => i * 120)
            .duration(1400)
            .ease(d3.easeQuadOut)
            .attrTween('d', function(d) {
                const i = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d);
                return t => arc(i(t));
            });
    };

    window.resetDistributionChart = function() {
        distributionChartAnimated = false;
        slices
            .transition()
            .duration(300)
            .attr('d', d => arc({ startAngle: d.startAngle, endAngle: d.startAngle }))
            .attr('transform', d => translateFor(d));
        defaultCenter();
    };
}

function createCombosChart(data) {
    const svg = d3.select('#chart-combos');
    const container = svg.node().parentElement;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    // Calculate combo data from derived trope flags
    const combos = {};
    const comboSpecificCounts = {};
    floridaManData.forEach(d => {
        const tropes = getTropesCached(d);
        const active = [];
        if (tropes.animals) active.push('Animals');
        if (tropes.nudity) active.push('Nudity');
        if (tropes.substances) active.push('Substances');
        if (tropes.weapons) active.push('Weapons');
        
        if (active.length >= 2) {
            const key = active.sort().join(' + ');
            combos[key] = (combos[key] || 0) + 1;

            // Track most common specific cues for this combo
            const specifics = {};
            if (active.includes('Animals')) specifics.animals = extractCueLabel(d.headline, 'animals');
            if (active.includes('Nudity')) specifics.nudity = extractCueLabel(d.headline, 'nudity');
            if (active.includes('Substances')) specifics.substances = extractCueLabel(d.headline, 'substances');
            if (active.includes('Weapons')) specifics.weapons = extractCueLabel(d.headline, 'weapons');

            const allPresent = active.every(t => {
                const keyLower = t.toLowerCase();
                return specifics[keyLower];
            });
            if (allPresent) {
                const specificKey = active.map(t => specifics[t.toLowerCase()]).join(' + ');
                const bucket = comboSpecificCounts[key] || {};
                bucket[specificKey] = (bucket[specificKey] || 0) + 1;
                comboSpecificCounts[key] = bucket;
            }
        }
    });

    let chartData = Object.entries(combos)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Precompute the top combo for each individual trope (by count)
    const topComboByTrope = {};
    chartData.forEach(d => {
        const tropes = d.name.split(' + ').map(t => t.trim());
        tropes.forEach(trope => {
            const current = topComboByTrope[trope];
            if (!current || d.value > current.value) {
                topComboByTrope[trope] = d;
            }
        });
    });

    const displayComboName = (name) => {
        const parts = name.split(' + ').map(p => p.trim());
        return parts.length === 4 ? 'All four tropes' : name;
    };

    const x = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.value) * 1.1])
        .range([margin.left + 120, width - margin.right]);

    const y = d3.scaleBand()
        .domain(chartData.map(d => d.name))
        .range([margin.top, height - margin.bottom])
        .padding(0.3);

    // Gradients for combo bars using trope colors
    const tropeColorMap = {
        Animals: colors.animals,
        Nudity: colors.nudity,
        Substances: colors.substances,
        Weapons: colors.weapons
    };

    // Tooltip
    const tooltipContainer = d3.select(container);
    tooltipContainer.selectAll('.combo-tooltip').remove();
    const tooltip = tooltipContainer
        .append('div')
        .attr('class', 'combo-tooltip')
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .style('padding', '8px 10px')
        .style('background', 'var(--paper)')
        .style('border', '1px solid #d1d1d6')
        .style('border-radius', '6px')
        .style('box-shadow', '0 8px 24px rgba(0,0,0,0.12)')
        .style('font-size', '11px')
        .style('color', '#1d1d1f')
        .style('display', 'none');

    // Top specific pair per combo (based on cue labels)
    const topSpecificByCombo = {};
    Object.entries(comboSpecificCounts).forEach(([combo, bucket]) => {
        const entries = Object.entries(bucket).sort((a, b) => b[1] - a[1]);
        if (entries.length) {
            topSpecificByCombo[combo] = { name: entries[0][0], value: entries[0][1] };
        }
    });

    function showTooltip(event, d) {
        const topSpecific = topSpecificByCombo[d.name];
        const label = topSpecific ? displayComboName(topSpecific.name) : displayComboName(d.name);
        const value = topSpecific ? topSpecific.value : d.value;
        const [mx, my] = d3.pointer(event, container);
        const isAllFour = d.name.split(' + ').length === 4;
        const content = isAllFour && topSpecific
            ? `<div><strong>Most common:</strong> ${label} (${value.toLocaleString()})</div>`
            : `<div><strong>${label}</strong> (${value.toLocaleString()})</div>`;
        tooltip.html(content)
            .style('left', `${mx + 16}px`)
            .style('top', `${my - 10}px`)
            .style('display', 'block');
    }

    function hideTooltip() {
        tooltip.style('display', 'none');
    }

    // Bars (start at width 0 for animation)
    svg.selectAll('.bar')
        .data(chartData)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', margin.left + 120)
        .attr('y', d => y(d.name))
        .attr('width', 0)
        .attr('height', y.bandwidth())
        .attr('fill', d => {
            const tropes = d.name.split(' + ').map(t => t.trim());
            if (tropes.length === 1) return tropeColorMap[tropes[0]] || '#40916c';
            const first = tropes[0];
            const last = tropes[tropes.length - 1];
            // Simple two-tone blend via linearGradient in defs
            const gradId = `combo-${first}-${last}`.replace(/[^a-z0-9-]/gi, '');
            const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
            if (defs.select(`#${gradId}`).empty()) {
                const grad = defs.append('linearGradient')
                    .attr('id', gradId)
                    .attr('x1', '0%').attr('y1', '0%')
                    .attr('x2', '100%').attr('y2', '0%');
                grad.append('stop').attr('offset', '0%').attr('stop-color', tropeColorMap[first] || colors.orange[0]);
                grad.append('stop').attr('offset', '100%').attr('stop-color', tropeColorMap[last] || colors.orange[3]);
            }
            return `url(#${gradId})`;
        })
        .attr('rx', 4)
        .on('mouseover', showTooltip)
        .on('mousemove', showTooltip)
        .on('mouseout', hideTooltip);

    // Value labels
    svg.selectAll('.value-label')
        .data(chartData)
        .join('text')
        .attr('class', 'value-label')
        .attr('x', margin.left + 120 + 8)
        .attr('y', d => y(d.name) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .attr('fill', '#1d1d1f')
        .text('0');

    // Y axis labels
    svg.selectAll('.y-label')
        .data(chartData)
        .join('text')
        .attr('class', 'y-label')
        .attr('x', margin.left + 115)
        .attr('y', d => y(d.name) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('font-size', '11px')
        .attr('fill', '#515154')
        .text(d => displayComboName(d.name));

    // Title
    svg.append('text')
        .attr('class', 'chart-title')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .text('Multi-Trope Combinations');

    // Animate
    window.animateCombosChart = function() {
        if (combosChartAnimated) return;
        combosChartAnimated = true;
        const duration = 3500;

        svg.selectAll('.bar')
            .transition()
            .duration(duration)
            .ease(d3.easeQuadOut)
            .attr('width', d => x(d.value) - margin.left - 120);

        svg.selectAll('.value-label')
            .each(function(d) {
                const label = d3.select(this);
                const target = d.value;
                label.transition()
                    .duration(duration)
                    .ease(d3.easeQuadOut)
                    .attr('x', d => x(d.value) + 8)
                    .tween('text', function() {
                        const interp = d3.interpolateNumber(0, target);
                        return function(t) {
                            label.text(Math.round(interp(t)).toLocaleString());
                        };
                    });
            });
    };

    window.resetCombosChart = function() {
        if (!combosChartAnimated) return;
        combosChartAnimated = false;
        svg.selectAll('.bar')
            .transition()
            .duration(300)
            .attr('width', 0);
        svg.selectAll('.value-label')
            .transition()
            .duration(300)
            .attr('x', margin.left + 120 + 8)
            .text('0');
    };

    // Dynamic narrative for combos
    const top = chartData[0];
    const second = chartData[1];
    const third = chartData[2];
    const threeTropes = chartData
        .filter(d => d.name.split('+').length === 3)
        .reduce((sum, d) => sum + d.value, 0);
    const fourTropes = chartData
        .filter(d => d.name.split('+').length >= 4)
        .reduce((sum, d) => sum + d.value, 0);
    const fmt = (n) => n.toLocaleString();
    const narrativeEl = document.getElementById('combos-narrative');
    if (narrativeEl && top) {
        const formatComboName = (name, capitalizeFirst = false) => {
            const parts = name.split(' + ').map(p => p.toLowerCase());
            if (parts.length === 4) return 'all tropes';
            if (capitalizeFirst && parts.length) {
                parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            }
            return parts.join(' and ');
        };

        const formatComboNameBold = (name, capitalizeFirst = false) => {
            const formatted = formatComboName(name, capitalizeFirst);
            return `<strong>${formatted}</strong>`;
        };

        const parts = [];
        parts.push(`<strong>${formatComboName(top.name, true)}</strong> shows up the most at <strong>${fmt(top.value)}</strong> headlines.`);
        if (second) {
            parts.push(`${formatComboName(second.name, true)} follows at ${fmt(second.value)}.`);
        }
        if (third) {
            parts.push(`${formatComboName(third.name, true)} lands at ${fmt(third.value)}.`);
        }
        if (fourTropes) {
            parts.push(` And, unsurprisingly, there are <strong>${fmt(fourTropes)}</strong> stories that involve <strong>all four tropes</strong>.`);
        } else {
            parts.push(` And no headline in this dataset packs <strong>all four tropes</strong> at once... yet.`);
        }
        const main = parts.join(' ');
        const footer = '<br><br>Hover over a specific combination to see the most popular pairings.';
        narrativeEl.innerHTML = `${main}${footer}`;
    } else if (narrativeEl) {
        narrativeEl.textContent = 'Combo data will load with the chart.';
    }
}

function createGeographyChart(data) {
    const svg = d3.select('#chart-geography');
    const container = svg.node().parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    const chartData = Object.entries(data.locations)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 20);

    const x = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.value) * 1.1])
        .range([margin.left + 100, width - margin.right]);

    const y = d3.scaleBand()
        .domain(chartData.map(d => d.name))
        .range([margin.top, height - margin.bottom])
        .padding(0.3);

    // Color scale - match county map oranges
    const colorScale = d3.scaleSequential(d3.interpolateOranges)
        .domain([chartData.length, 0]);

    // Bars (start collapsed for animation)
    const bars = svg.selectAll('.bar')
        .data(chartData)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', margin.left + 100)
        .attr('y', d => y(d.name))
        .attr('width', 0)
        .attr('height', y.bandwidth())
        .attr('fill', (d, i) => colorScale(i))
        .attr('rx', 4);

    // Value labels (start at 0)
    const valueLabels = svg.selectAll('.value-label')
        .data(chartData)
        .join('text')
        .attr('class', 'value-label')
        .attr('x', margin.left + 108)
        .attr('y', d => y(d.name) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .attr('fill', '#1d1d1f')
        .text('0');

    // Y axis labels
    svg.selectAll('.y-label')
        .data(chartData)
        .join('text')
        .attr('class', 'y-label')
        .attr('x', margin.left + 95)
        .attr('y', d => y(d.name) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('font-size', '11px')
        .attr('fill', '#515154')
        .text(d => d.name.replace(', FL', ''));

    // Title
    svg.append('text')
        .attr('class', 'chart-title')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .text('Top Locations');

    // Animation hooks
    window.animateGeographyChart = function() {
        if (geographyChartAnimated) return;
        geographyChartAnimated = true;

        bars.transition()
            .duration(3500)
            .ease(d3.easeQuadOut)
            .attr('width', d => x(d.value) - margin.left - 100);

        valueLabels.transition()
            .duration(3500)
            .ease(d3.easeQuadOut)
            .attr('x', d => x(d.value) + 8)
            .tween('text', function(d) {
                const i = d3.interpolateNumber(0, d.value);
                return function(t) {
                    this.textContent = Math.round(i(t)).toLocaleString();
                };
            });
    };

    window.resetGeographyChart = function() {
        geographyChartAnimated = false;
        bars.transition().duration(300).attr('width', 0);
        valueLabels.transition().duration(300).attr('x', margin.left + 108).text('0');
    };
}

// D3 county choropleth (Florida only)
function createMapViz(data) {
    const container = document.getElementById('map-geography');
    if (!container) return;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 400;
    container.innerHTML = '';

    const tooltip = d3.select(container)
        .append('div')
        .attr('class', 'map-tooltip');

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    const g = svg.append('g');

    // Merge county counts with city-to-county rollups so the map aligns with the location bar chart
    const CITY_TO_COUNTY = {
        // Miami-Dade & vicinity
        'miami': 'Miami-Dade',
        'miami-dade county': 'Miami-Dade',
        'miami dade': 'Miami-Dade',
        'miami beach': 'Miami-Dade',
        'north miami': 'Miami-Dade',
        'coral gables': 'Miami-Dade',
        'hialeah': 'Miami-Dade',
        'homestead': 'Miami-Dade',
        // Broward
        'fort lauderdale': 'Broward',
        'ft lauderdale': 'Broward',
        'ft. lauderdale': 'Broward',
        'pembroke pines': 'Broward',
        'hollywood': 'Broward',
        'pompano beach': 'Broward',
        'weston': 'Broward',
        'broward county': 'Broward',
        // Palm Beach
        'palm beach': 'Palm Beach',
        'palm beach county': 'Palm Beach',
        'west palm beach': 'Palm Beach',
        'delray beach': 'Palm Beach',
        'boynton beach': 'Palm Beach',
        'jupiter': 'Palm Beach',
        'lake worth': 'Palm Beach',
        'boca raton': 'Palm Beach',
        // Hillsborough / Tampa Bay
        'tampa': 'Hillsborough',
        'plant city': 'Hillsborough',
        'hillsborough county': 'Hillsborough',
        'st. petersburg': 'Pinellas',
        'st petersburg': 'Pinellas',
        'saint petersburg': 'Pinellas',
        'st pete': 'Pinellas',
        'clearwater': 'Pinellas',
        'pinellas county': 'Pinellas',
        // Central Florida
        'orlando': 'Orange',
        'winter park': 'Orange',
        'orange county': 'Orange',
        'kissimmee': 'Osceola',
        'st cloud': 'Osceola',
        'st. cloud': 'Osceola',
        'osceola county': 'Osceola',
        // South Gulf
        'fort myers': 'Lee',
        'fort myers beach': 'Lee',
        'ft myers': 'Lee',
        'ft. myers': 'Lee',
        'cape coral': 'Lee',
        'naples': 'Collier',
        'marco island': 'Collier',
        // Florida Keys / Monroe
        'key west': 'Monroe',
        'key largo': 'Monroe',
        'islamorada': 'Monroe',
        'marathon': 'Monroe',
        'florida keys': 'Monroe',
        // East Coast / Space coast
        'daytona beach': 'Volusia',
        'deltona': 'Volusia',
        'palm coast': 'Flagler',
        // North / Panhandle
        'jacksonville': 'Duval',
        'pensacola': 'Escambia',
        'panama city': 'Bay',
        'tallahassee': 'Leon',
        'lake city': 'Columbia',
        // Other counties and cities
        'gainesville': 'Alachua',
        'ocala': 'Marion',
        'sarasota': 'Sarasota',
        'bradenton': 'Manatee',
        'manatee county': 'Manatee',
        'the villages': 'Sumter',
        'lakeland': 'Polk',
        'winter haven': 'Polk',
        'polk county': 'Polk',
        'lake county': 'Lake',
        'broward county': 'Broward',
        'duval county': 'Duval',
        'st lucie': 'St. Lucie',
        'st. lucie': 'St. Lucie',
        'st lucie county': 'St. Lucie',
        'st. lucie county': 'St. Lucie',
        'port st lucie': 'St. Lucie',
        'port saint lucie': 'St. Lucie',
        'st johns': 'St. Johns',
        'st. johns': 'St. Johns',
        'st johns county': 'St. Johns',
        'st. johns county': 'St. Johns'
    };
    const mergedCounts = { ...(data.counties || {}) };
    const normalizeLoc = (n) => {
        const cleaned = (n || '').toLowerCase()
            .replace(/,?\s*(?:florida|fl)\.?/gi, '')
            .replace(/\./g, '')
            .replace(/\bft\b/g, 'fort')
            .replace(/\bst\b/g, 'saint')
            .replace(/\bsaint\b/g, 'saint')
            .trim();
        return cleaned;
    };
    Object.entries(data.locations || {}).forEach(([name, val]) => {
        const norm = normalizeLoc(name);
        // Try full match, then trim trailing 'city', then trim trailing 'county'
        const candidates = [
            norm,
            norm.replace(/\s+city$/, ''),
            norm.replace(/\s+county$/, '')
        ];
        let county = null;
        for (const key of candidates) {
            if (CITY_TO_COUNTY[key]) {
                county = CITY_TO_COUNTY[key];
                break;
            }
        }
        // Fallback: substring match against known counties
        if (!county && typeof COUNTY_NAMES !== 'undefined') {
            const plain = norm.replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
            const found = COUNTY_NAMES.find(c => {
                const cNorm = c.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').trim();
                return plain.includes(cNorm);
            });
            if (found) county = found;
        }
        if (county) {
            mergedCounts[county] = (mergedCounts[county] || 0) + val;
        }
    });

    // Normalize county keys (strip trailing 'County')
    const counts = {};
    Object.entries(mergedCounts).forEach(([k, v]) => {
        const norm = (k || '').replace(/\s+County$/i, '').trim();
        counts[norm] = (counts[norm] || 0) + v;
    });
    const maxCount = Math.max(0, ...Object.values(counts));
    const colorScale = d3.scaleSequential(d3.interpolateOranges).domain([0, maxCount || 1]);

    // Prefer local county geojson to avoid CORS/network hiccups; fall back to remote if needed
    const localGeoPath = new URL('florida-counties.geojson', window.location.href).toString();
    if (!window.floridaGeojsonPromise) {
        window.floridaGeojsonPromise = fetch(localGeoPath)
            .then(res => {
                if (!res.ok) throw new Error('local geojson missing');
                return res.json();
            })
            .catch(() => fetch('https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json')
                .then(r => r.json())
                .then(full => ({
                    type: 'FeatureCollection',
                    features: (full.features || []).filter(f => f.properties && f.properties.STATE === '12')
                })));
    }

    window.floridaGeojsonPromise.then(geojson => {
        if (!geojson || !Array.isArray(geojson.features)) {
            throw new Error('GeoJSON missing features');
        }
        const projection = d3.geoMercator().fitSize([width, height], geojson);
        const path = d3.geoPath(projection);

        // Counties (choropleth)
        g.selectAll('path.county')
            .data(geojson.features)
            .join('path')
            .attr('class', 'county')
            .attr('d', path)
            .attr('fill', d => {
                const rawName = d.properties && (d.properties.name || d.properties.NAME);
                const key = rawName ? rawName.replace(/ County$/i, '') : '';
                const v = counts[key] || 0;
                return v ? colorScale(v) : '#f8f2e1';
            })
            .attr('stroke', '#d8cbb0')
            .attr('stroke-width', 0.8)
            .on('mousemove', function(event, d) {
                const rawName = d.properties && (d.properties.name || d.properties.NAME);
                const key = rawName ? rawName.replace(/ County$/i, '') : '';
                const v = counts[key] || 0;
                const tooltipNode = tooltip.node();
                tooltip
                    .style('opacity', 1)
                    .html(`<strong>${rawName || 'County'}</strong><br>${v.toLocaleString()} headlines`);
                // Position tooltip and clamp to container so it doesn't get cut off
                const padding = 12;
                const containerRect = container.getBoundingClientRect();
                const ttRect = tooltipNode.getBoundingClientRect();
                let left = event.clientX - containerRect.left + padding;
                let top = event.clientY - containerRect.top - ttRect.height / 2;
                // Clamp within container
                left = Math.min(Math.max(left, padding), containerRect.width - ttRect.width - padding);
                top = Math.min(Math.max(top, padding), containerRect.height - ttRect.height - padding);
                tooltip.style('left', `${left}px`).style('top', `${top}px`);
            })
            .on('mouseleave', () => tooltip.style('opacity', 0));

        // State outline
        g.append('path')
            .datum(geojson)
            .attr('fill', 'none')
            .attr('stroke', '#d8cbb0')
            .attr('stroke-width', 1)
            .attr('d', path);

        // Legend (gradient)
        const legendWidth = 160;
        const legendHeight = 10;

        // Place legend in lower-left corner inside the visualization
        const legendX = margin.left;
        const legendY = height - margin.bottom - legendHeight - 16;

        const defs = svg.append('defs');
        const grad = defs.append('linearGradient')
            .attr('id', 'map-legend')
            .attr('x1', '0%').attr('x2', '100%')
            .attr('y1', '0%').attr('y2', '0%');
        d3.range(0, 1.01, 0.1).forEach((s) => {
            grad.append('stop')
                .attr('offset', `${s * 100}%`)
                .attr('stop-color', colorScale(maxCount * s));
        });

        svg.append('rect')
            .attr('x', legendX)
            .attr('y', legendY)
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .attr('fill', 'url(#map-legend)')
            .attr('stroke', '#e1e1e1')
            .attr('stroke-width', 0.5);

        svg.append('text')
            .attr('x', legendX)
            .attr('y', legendY - 6)
            .attr('fill', '#515154')
            .attr('font-size', 11)
            .text('Headlines per county');

        const legendScale = d3.scaleLinear()
            .domain([0, maxCount || 1])
            .range([legendX, legendX + legendWidth]);
        const legendAxis = d3.axisBottom(legendScale)
            .ticks(4)
            .tickFormat(d => d.toLocaleString());
        svg.append('g')
            .attr('transform', `translate(0,${legendY + legendHeight})`)
            .call(legendAxis)
            .selectAll('text')
            .attr('font-size', 10);
    }).catch((err) => {
        console.error('Map failed to load', err);
        container.innerHTML = '<p style=\"padding:12px\">Map data failed to load.</p>';
    });
}

function createWordsChart() {
    const svg = d3.select('#chart-words');
    if (svg.empty() || !svg.node()) return;
    const container = svg.node().parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    // Extract interesting words
    const wordCounts = new Map();
    floridaManData.forEach(d => {
        if (!d.headline) return;
        const words = d.headline.toLowerCase().match(WORD_PATTERN);
        if (!words) return;
        words
            .filter(w => !STOPWORDS_SET.has(w))
            .forEach(w => wordCounts.set(w, (wordCounts.get(w) || 0) + 1));
    });

    const chartData = [...wordCounts.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 20);

    const x = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.value) * 1.1])
        .range([margin.left + 80, width - margin.right]);

    const y = d3.scaleBand()
        .domain(chartData.map(d => d.name))
        .range([margin.top, height - margin.bottom])
        .padding(0.25);

    // Color scale - viridis-like
    const colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain([0, chartData.length]);

    // Bars (start collapsed for animation)
    const bars = svg.selectAll('.bar')
        .data(chartData)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', margin.left + 80)
        .attr('y', d => y(d.name))
        .attr('width', 0)
        .attr('height', y.bandwidth())
        .attr('fill', (d, i) => colorScale(chartData.length - i))
        .attr('rx', 3);

    // Value labels (start at 0)
    const valueLabels = svg.selectAll('.value-label')
        .data(chartData)
        .join('text')
        .attr('class', 'value-label')
        .attr('x', margin.left + 86)
        .attr('y', d => y(d.name) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('fill', '#1d1d1f')
        .text('0');

    // Y axis labels
    svg.selectAll('.y-label')
        .data(chartData)
        .join('text')
        .attr('class', 'y-label')
        .attr('x', margin.left + 75)
        .attr('y', d => y(d.name) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('font-size', '12px')
        .attr('fill', '#515154')
        .text(d => d.name);

    // Title
    svg.append('text')
        .attr('class', 'chart-title')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .text('Most Common Words');

    // Animation hooks
    window.animateWordsChart = function() {
        if (wordsChartAnimated) return;
        wordsChartAnimated = true;

        bars.transition()
            .duration(3500)
            .ease(d3.easeQuadOut)
            .attr('width', d => x(d.value) - margin.left - 80);

        valueLabels.transition()
            .duration(3500)
            .ease(d3.easeQuadOut)
            .attr('x', d => x(d.value) + 6)
            .tween('text', function(d) {
                const i = d3.interpolateNumber(0, d.value);
                return function(t) {
                    this.textContent = Math.round(i(t));
                };
            });
    };

    window.resetWordsChart = function() {
        wordsChartAnimated = false;
        bars.transition().duration(300).attr('width', 0);
        valueLabels.transition().duration(300).attr('x', margin.left + 86).text('0');
    };
}

function createAbsurdityChart(data) {
    const input = document.getElementById('absurdity-input');
    const button = document.getElementById('absurdity-search');
    const resultsEl = document.getElementById('absurdity-results');
    if (!input || !button || !resultsEl) return;

    // Avoid rebinding events on resize
    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';

    const resizeInput = () => {
        input.style.height = 'auto';
        input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
    };
    input.addEventListener('input', resizeInput);
    resizeInput();

    const STOP = new Set([
        'the','a','an','and','or','of','for','to','in','on','at','with','from','by','about','after','before','during','without','into','onto','as','is','are','was','were','be','being','been','this','that','these','those','it','its','his','her','their','then','than','while',
        'florida','man','woman','men','women','floridaman','floridawoman',
        'police','officer','officers','sheriff','deputy','deputies','arrest','arrested','arrests','charge','charged','charges','accused','alleged','allegedly',
        'kill','kills','killed','killing','shoot','shoots','shot','shooting'
    ]);
    const tokenizeRaw = (text) => (text || '').toLowerCase().match(/[a-z0-9']+/g) || [];
    const stem = (t) => {
        if (t.length <= 3) return t;
        return t.replace(/(ings|ing|ed|ies|s)$/,'').replace(/(er|est)$/,'');
    };
    const tokenize = (text) => tokenizeRaw(text).filter(t => !STOP.has(t)).map(stem);
    const makeNgrams = (tokens) => {
        const grams = [];
        for (let n = 2; n <= 3; n++) {
            for (let i = 0; i <= tokens.length - n; i++) {
                grams.push(tokens.slice(i, i + n).join(' '));
            }
        }
        return grams;
    };
    const levenshtein = (a, b) => {
        if (a === b) return 0;
        const dp = Array(b.length + 1).fill(0).map((_, i) => i);
        for (let i = 1; i <= a.length; i++) {
            let prev = i - 1;
            dp[0] = i;
            for (let j = 1; j <= b.length; j++) {
                const tmp = dp[j];
                dp[j] = Math.min(
                    dp[j] + 1,
                    dp[j - 1] + 1,
                    prev + (a[i - 1] === b[j - 1] ? 0 : 1)
                );
                prev = tmp;
            }
        }
        return dp[b.length];
    };

    // Build index with unigrams + bigrams/trigrams and BM25-ish stats
    const docs = floridaManData
        .map(d => {
            const tokens = tokenize(d.headline || '');
            const bigrams = makeNgrams(tokens);
            const all = [...tokens, ...bigrams];
            return {
                headline: d.headline || '',
                url: d.source_url || '',
                terms: all,
                rawTokens: tokenizeRaw(d.headline || '')
            };
        })
        .filter(d => d.headline);

    const docFreq = new Map();
    let avgLen = 0;
    docs.forEach(d => {
        const seen = new Set();
        avgLen += d.terms.length;
        d.terms.forEach(t => {
            if (seen.has(t)) return;
            seen.add(t);
            docFreq.set(t, (docFreq.get(t) || 0) + 1);
        });
    });
    const N = docs.length || 1;
    avgLen = docs.length ? avgLen / docs.length : 1;

    const idf = (term) => {
        const df = docFreq.get(term) || 0;
        return Math.log((N - df + 0.5) / (df + 0.5) + 1);
    };

    const score = (qTokens, item) => {
        if (!qTokens.length) return 0;
        const termCounts = new Map();
        item.terms.forEach(t => termCounts.set(t, (termCounts.get(t) || 0) + 1));
        const k1 = 1.5;
        const b = 0.75;
        let s = 0;
        qTokens.forEach(qt => {
            const tf = termCounts.get(qt) || 0;
            if (!tf) return;
            const idfVal = idf(qt);
            const denom = tf + k1 * (1 - b + b * (item.terms.length / avgLen));
            s += idfVal * ((tf * (k1 + 1)) / denom);
        });
        // small bonus for substring presence
        if ((item.headline || '').toLowerCase().includes(qTokens.join(' '))) s += 0.2;
        return s;
    };

    const fuzzyFallback = (query, item) => {
        const q = (query || '').toLowerCase();
        const h = (item.headline || '').toLowerCase();
        if (!q || !h) return 0;
        const grams = (str) => {
            const g = [];
            for (let i = 0; i < str.length - 2; i++) g.push(str.slice(i, i + 3));
            return g;
        };
        const qg = grams(q);
        const hg = grams(h);
        const setH = new Set(hg);
        const inter = qg.filter(g => setH.has(g)).length;
        const union = new Set([...qg, ...hg]).size || 1;
        return inter / union;
    };

    const render = (matches) => {
        resultsEl.innerHTML = '';
        if (!matches.length) {
            const li = document.createElement('li');
            li.textContent = 'No close matches found.';
            resultsEl.appendChild(li);
            return;
        }
        const maxScore = Math.max(...matches.map(m => m.s || 0), 0.0001);
        matches.forEach(m => {
            const li = document.createElement('li');
            if (m.url) {
                const a = document.createElement('a');
                a.href = m.url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.className = 'pure-link';
                a.textContent = m.headline;
                li.appendChild(a);
            } else {
                li.textContent = m.headline;
            }
            const meta = document.createElement('div');
            meta.className = 'absurdity-meta';

            const scoreWrap = document.createElement('div');
            scoreWrap.className = 'absurdity-score';
            const bar = document.createElement('div');
            bar.className = 'absurdity-score-bar';
            const pct = Math.max(5, Math.min(100, (m.s / maxScore) * 100));
            bar.style.width = `${pct}%`;
            scoreWrap.appendChild(bar);
            meta.appendChild(scoreWrap);

            if (m.matches && m.matches.length) {
                const matchLine = document.createElement('div');
                matchLine.className = 'absurdity-matches';
                matchLine.textContent = m.matches.slice(0, 5).join(', ');
                meta.appendChild(matchLine);
            }

            li.appendChild(meta);
            resultsEl.appendChild(li);
        });
    };

    const handleSearch = () => {
        const q = input.value.trim();
        if (!q) {
            resultsEl.innerHTML = '';
            return;
        }
        const qTokens = tokenize(q);
        const qBigrams = makeNgrams(qTokens);
        const allQ = [...qTokens, ...qBigrams];

        let scored = docs.map(item => ({ ...item, s: score(allQ, item) }))
            .filter(item => item.s > 0)
            .sort((a, b) => b.s - a.s)
            .slice(0, 7);

        if (!scored.length) {
            scored = docs.map(item => {
                // token-level fuzzy: best min distance
                const qRaw = tokenizeRaw(q);
                let best = 0;
                qRaw.forEach(qt => {
                    item.rawTokens.forEach(rt => {
                        const dist = levenshtein(qt, rt);
                        if (dist <= 1) best = Math.max(best, 0.5);
                    });
                });
                const trigram = fuzzyFallback(q, item);
                return { ...item, s: Math.max(best, trigram) };
            })
                .filter(item => item.s > 0)
                .sort((a, b) => b.s - a.s)
                .slice(0, 5);
        }

        // collect matched terms for display
        const scoredWithMatches = scored.map(item => {
            const matches = [];
            const stemmedSet = new Set(item.terms);
            allQ.forEach(qt => {
                if (stemmedSet.has(qt)) matches.push(qt);
            });
            const filteredMatches = matches.filter(m => m.length > 3 && !STOP.has(m));
            return { ...item, matches: filteredMatches };
        });

        render(scoredWithMatches);
    };

    button.addEventListener('click', handleSearch);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });
}

function createTimelineChart(data) {
    const svg = d3.select('#chart-timeline');
    const container = svg.node().parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    // Aggregate counts across all years by month name
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyTotals = Array(12).fill(0);
    Object.entries(data.byMonth || {}).forEach(([key, value]) => {
        const parts = key.split('-'); // YYYY-MM
        const monthIdx = parseInt(parts[1], 10) - 1;
        if (monthIdx >= 0 && monthIdx < 12) {
            monthlyTotals[monthIdx] += value;
        }
    });

    const chartData = months.map((name, i) => ({ name, value: monthlyTotals[i] || 0 }));
    if (!chartData.length) return;

    const x = d3.scalePoint()
        .domain(chartData.map(d => d.name))
        .range([margin.left, width - margin.right])
        .padding(0.5);

    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.value) * 1.1])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Area
    const area = d3.area()
        .x(d => x(d.name))
        .y0(height - margin.bottom)
        .y1(d => y(d.value))
        .curve(d3.curveMonotoneX);

    const areaPath = svg.append('path')
        .datum(chartData)
        .attr('fill', colors.teal)
        .attr('fill-opacity', 0.0)
        .attr('d', area);

    // Line
    const line = d3.line()
        .x(d => x(d.name))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

    const linePath = svg.append('path')
        .datum(chartData)
        .attr('fill', 'none')
        .attr('stroke', colors.teal)
        .attr('stroke-width', 3)
        .attr('d', line);

    // Get total line length for animation
    const totalLength = linePath.node().getTotalLength();
    linePath
        .attr('stroke-dasharray', totalLength)
        .attr('stroke-dashoffset', totalLength);

    // Dots
    svg.selectAll('.dot')
        .data(chartData)
        .join('circle')
        .attr('class', 'dot')
        .attr('cx', d => x(d.name))
        .attr('cy', d => y(d.value))
        .attr('r', 5)
        .attr('fill', colors.teal);

    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('font-size', '12px')
        .attr('font-weight', '500');

    // Y axis
    svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5));

    // Title
    svg.append('text')
        .attr('class', 'chart-title')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .text('Seasonal Trends (Aggregated)');

    // Tooltip
    const tooltip = svg.append('g')
        .attr('class', 'tooltip-group')
        .style('display', 'none');

    tooltip.append('circle')
        .attr('r', 5)
        .attr('fill', colors.teal)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    const tooltipRect = tooltip.append('rect')
        .attr('fill', 'rgba(0,0,0,0.8)')
        .attr('rx', 4)
        .attr('ry', 4);

    const tooltipText = tooltip.append('text')
        .attr('fill', '#fff')
        .attr('font-size', '12px')
        .attr('text-anchor', 'middle');

    const tooltipMonth = tooltipText.append('tspan')
        .attr('x', 0)
        .attr('dy', '-0.5em')
        .attr('font-weight', '600');

    const tooltipCount = tooltipText.append('tspan')
        .attr('x', 0)
        .attr('dy', '1.4em');

    svg.append('rect')
        .attr('fill', 'transparent')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', width - margin.left - margin.right)
        .attr('height', height - margin.top - margin.bottom)
        .on('mousemove', function(event) {
            // Use SVG-relative coordinates so we can compare directly to scale outputs
            const [mx] = d3.pointer(event, svg.node());
            const nearest = chartData.reduce((best, d) => {
                const cx = x(d.name);
                const dist = Math.abs(mx - cx);
                return dist < best.dist ? { d, dist, cx } : best;
            }, { d: null, dist: Infinity, cx: null });
            if (!nearest.d) return;
            const d = nearest.d;
            const xPos = nearest.cx;

            const yPos = y(d.value);

            tooltip.style('display', null);
            tooltip.attr('transform', `translate(${xPos},${yPos})`);

            // Full month name
            const monthsFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const monthFull = monthsFull[months.indexOf(d.name)] || d.name;
            tooltipMonth.text(monthFull);
            tooltipCount.text(`${d.value.toLocaleString()} headlines`);

            const bbox = tooltipText.node().getBBox();
            const tooltipWidth = bbox.width + 16;
            const tooltipHeight = bbox.height + 10;

            // Keep tooltip centered on the point but clamp inside the chart so it stays close
            tooltipText.attr('text-anchor', 'middle');
            tooltipMonth.attr('x', 0);
            tooltipCount.attr('x', 0);
            const unclampedLeft = xPos - tooltipWidth / 2;
            const clampedLeft = Math.min(
                Math.max(unclampedLeft, margin.left + 4),
                width - margin.right - tooltipWidth - 4
            );
            const xOffset = clampedLeft - unclampedLeft;

            tooltipRect
                .attr('x', bbox.x - 8 + xOffset)
                .attr('y', bbox.y - 25)
                .attr('width', tooltipWidth)
                .attr('height', tooltipHeight);
            tooltipText.attr('transform', `translate(${xOffset}, -20)`);
        })
        .on('mouseleave', () => tooltip.style('display', 'none'));

    // Animation hooks
    window.animateTimelineChart = function() {
        if (timelineChartAnimated) return;
        timelineChartAnimated = true;

        linePath.transition()
            .duration(4000)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', 0);

        areaPath.transition()
            // Let the line finish, then wash in the fill underneath
            .delay(4000)
            .duration(1400)
            .ease(d3.easeQuadOut)
            .attr('fill-opacity', 0.3);
    };

    window.resetTimelineChart = function() {
        timelineChartAnimated = false;
        linePath.interrupt().attr('stroke-dashoffset', totalLength);
        areaPath.interrupt().attr('fill-opacity', 0);
    };
}

function createDatasetViz(data) {
    const svg = d3.select('#chart-dataset');
    if (svg.empty()) return;

    const container = svg.node().parentElement;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 400;
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    // Process data by month
    const monthlyData = {};
    floridaManData.forEach(d => {
        if (!d.date) return;
        const date = new Date(d.date);
        if (isNaN(date.getTime())) return;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    // Convert to array and sort
    const chartData = Object.entries(monthlyData)
        .map(([key, count]) => ({
            date: new Date(key + '-01'),
            count: count
        }))
        .filter(d => !isNaN(d.date.getTime()))
        .sort((a, b) => a.date - b.date);

    if (chartData.length === 0) return;

    // Scales
    const x = d3.scaleTime()
        .domain(d3.extent(chartData, d => d.date))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.count) * 1.1])
        .range([height - margin.bottom, margin.top]);

    // Line generator
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.count))
        .curve(d3.curveMonotoneX);

    // Area for gradient fill
    const area = d3.area()
        .x(d => x(d.date))
        .y0(height - margin.bottom)
        .y1(d => y(d.count))
        .curve(d3.curveMonotoneX);

    // Gradient
    const gradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', 'area-gradient')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%');
    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#40916c')
        .attr('stop-opacity', 0.4);
    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#40916c')
        .attr('stop-opacity', 0);

    // Draw area (initially hidden)
    const areaPath = svg.append('path')
        .datum(chartData)
        .attr('class', 'dataset-area')
        .attr('fill', 'url(#area-gradient)')
        .attr('d', area)
        .style('opacity', 0);

    // Draw line (initially hidden with dash offset)
    const linePath = svg.append('path')
        .datum(chartData)
        .attr('class', 'dataset-line')
        .attr('fill', 'none')
        .attr('stroke', '#2d6a4f')
        .attr('stroke-width', 2.5)
        .attr('d', line);

    // Get total line length for animation
    const totalLength = linePath.node().getTotalLength();
    linePath
        .attr('stroke-dasharray', totalLength)
        .attr('stroke-dashoffset', totalLength);

    // Store animation function globally (only runs once per scroll-down)
    window.animateDatasetChart = function() {
        // Animate line drawing - slower (4 seconds)
        linePath.transition()
            .duration(4000)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', 0);

        // Fade in area with delay
        areaPath.transition()
            .delay(1000)
            .duration(3000)
            .ease(d3.easeQuadOut)
            .style('opacity', 1);
    };

    // Reset animation function (called when scrolling up past the step)
    window.resetDatasetChart = function() {
        linePath.interrupt().attr('stroke-dashoffset', totalLength);
        areaPath.interrupt().style('opacity', 0);
    };

    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x)
            .ticks(d3.timeYear.every(1))
            .tickFormat(d3.timeFormat('%Y')))
        .selectAll('text')
        .attr('font-size', '11px');

    // Y axis
    svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5))
        .selectAll('text')
        .attr('font-size', '11px');

    // Y axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(height / 2))
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#666')
        .text('Headlines per Month');

    // Title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('class', 'chart-title')
        .attr('x', width / 2)
        .attr('y', 24)
        .attr('text-anchor', 'middle')
        .text('Florida Man Headlines Over The Years');

    // Tooltip
    const tooltip = svg.append('g')
        .attr('class', 'tooltip-group')
        .style('display', 'none');

    tooltip.append('circle')
        .attr('r', 5)
        .attr('fill', '#2d6a4f')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    const tooltipRect = tooltip.append('rect')
        .attr('fill', 'rgba(0,0,0,0.8)')
        .attr('rx', 4)
        .attr('ry', 4);

    const tooltipText = tooltip.append('text')
        .attr('fill', '#fff')
        .attr('font-size', '12px')
        .attr('text-anchor', 'middle');

    const tooltipDate = tooltipText.append('tspan')
        .attr('x', 0)
        .attr('dy', '-0.5em')
        .attr('font-weight', '600');

    const tooltipCount = tooltipText.append('tspan')
        .attr('x', 0)
        .attr('dy', '1.4em');

    // Bisector for finding closest data point
    const bisect = d3.bisector(d => d.date).center;

    // Overlay for mouse events
    svg.append('rect')
        .attr('fill', 'transparent')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', width - margin.left - margin.right)
        .attr('height', height - margin.top - margin.bottom)
        .on('mousemove', function(event) {
            const [mx] = d3.pointer(event);
            const dateAtMouse = x.invert(mx);
            const i = bisect(chartData, dateAtMouse);
            const d = chartData[i];
            if (!d) return;

            const xPos = x(d.date);
            const yPos = y(d.count);

            tooltip.style('display', null);
            tooltip.attr('transform', `translate(${xPos},${yPos})`);

            const monthYear = d3.timeFormat('%B %Y')(d.date);
            tooltipDate.text(monthYear);
            tooltipCount.text(`${d.count} headlines`);

            // Size the background rect
            const bbox = tooltipText.node().getBBox();
            const tooltipWidth = bbox.width + 16;
            const tooltipHeight = bbox.height + 10;
            
            // Determine if tooltip should flip horizontally (near right edge)
            let xOffset = 0;
            if (xPos + tooltipWidth / 2 > width - margin.right) {
                xOffset = -(tooltipWidth / 2 + 10);
                tooltipText.attr('text-anchor', 'end');
                tooltipDate.attr('x', -10);
                tooltipCount.attr('x', -10);
            } else if (xPos - tooltipWidth / 2 < margin.left) {
                xOffset = tooltipWidth / 2 + 10;
                tooltipText.attr('text-anchor', 'start');
                tooltipDate.attr('x', 10);
                tooltipCount.attr('x', 10);
            } else {
                xOffset = 0;
                tooltipText.attr('text-anchor', 'middle');
                tooltipDate.attr('x', 0);
                tooltipCount.attr('x', 0);
            }

            tooltipRect
                .attr('x', bbox.x - 8 + xOffset)
                .attr('y', bbox.y - 25)
                .attr('width', tooltipWidth)
                .attr('height', tooltipHeight);
            tooltipText.attr('transform', `translate(${xOffset}, -20)`);
        })
        .on('mouseleave', () => tooltip.style('display', 'none'));
}

// ============================================
// SCROLLAMA SETUP
// ============================================

function initScrollama() {
    const scroller = scrollama();
    const data = processData();

    // sync dataset totals in text
    const totalEl = document.getElementById('dataset-total');
    if (totalEl) totalEl.textContent = data.total.toLocaleString();
    const bigNum = document.querySelector('#viz-dataset .big-number');
    if (bigNum) bigNum.textContent = data.total.toLocaleString();
    // sync trope text
    updateTropeText(data);
    updateDistributionText(data);
    updatePureSection(data);
    updateGeographyText(data);
    updateSeasonalText(data);

    // Create all charts
    createDatasetViz(data);
    createTropeBarChart(data);
    createDistributionChart(data);
    createCombosChart(data);
    createGeographyChart(data);
    createMapViz(data);
    createWordsChart();
    createAbsurdityChart(data);
    createTimelineChart(data);

    // Step handler
    function handleStepEnter(response) {
        // Remove active class from all steps
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('is-active');
        });
        
        // Add active class to current step
        response.element.classList.add('is-active');

        // Hide all visualizations
        document.querySelectorAll('.viz').forEach(viz => {
            viz.classList.remove('active');
        });

        // Show the correct visualization
        const stepId = response.element.dataset.step;
        const vizElement = document.getElementById(`viz-${stepId}`);
        if (vizElement) {
            vizElement.classList.add('active');
        }

        // Trigger dataset chart animation when entering that step
        if (stepId === 'dataset' && window.animateDatasetChart) {
            window.animateDatasetChart();
        }

        // Trigger trope chart animation when entering that step
        if (stepId === 'tropes' && window.animateTropeChart) {
            window.animateTropeChart();
        }
        // Trigger combos chart animation when entering that step
        if (stepId === 'combos' && window.animateCombosChart) {
            window.animateCombosChart();
        }
        // Trigger distribution animation
        if (stepId === 'distribution' && window.animateDistributionChart) {
            window.animateDistributionChart();
        }
        if (stepId === 'pure') {
            // refresh random samples each time we enter the pure section
            updatePureSection(data);
        }
        if (stepId === 'words' && window.animateWordsChart) {
            window.animateWordsChart();
        }
        if (stepId === 'geography' && window.animateGeographyChart) {
            window.animateGeographyChart();
        }
        if (stepId === 'map') {
            createMapViz(data);
        }
        if (stepId === 'timeline' && window.animateTimelineChart) {
            window.animateTimelineChart();
        }
    }

    // Step exit handler - reset animation when scrolling up
    function handleStepExit(response) {
        const stepId = response.element.dataset.step;
        // If leaving dataset step by scrolling UP (direction = 'up'), reset the chart
        if (stepId === 'dataset' && response.direction === 'up' && window.resetDatasetChart) {
            window.resetDatasetChart();
        }
        // If leaving tropes step by scrolling UP, reset the chart
        if (stepId === 'tropes' && response.direction === 'up' && window.resetTropeChart) {
            window.resetTropeChart();
        }
        // If leaving combos step by scrolling UP, reset the chart
        if (stepId === 'combos' && response.direction === 'up' && window.resetCombosChart) {
            window.resetCombosChart();
        }
        if (stepId === 'distribution' && response.direction === 'up' && window.resetDistributionChart) {
            window.resetDistributionChart();
        }
        if (stepId === 'words' && response.direction === 'up' && window.resetWordsChart) {
            window.resetWordsChart();
        }
        if (stepId === 'geography' && response.direction === 'up' && window.resetGeographyChart) {
            window.resetGeographyChart();
        }
        if (stepId === 'timeline' && response.direction === 'up' && window.resetTimelineChart) {
            window.resetTimelineChart();
        }
    }

    // Setup scrollama
    scroller
        .setup({
            step: '#scrolly article .step',
            offset: 0.5,
            debug: false
        })
        .onStepEnter(handleStepEnter)
        .onStepExit(handleStepExit);

    // Handle resize
    window.addEventListener('resize', () => {
        scroller.resize();
        // Redraw charts
        createDatasetViz(data);
        createTropeBarChart(data);
        createDistributionChart(data);
        createCombosChart(data);
        createGeographyChart(data);
        createMapViz(data);
        createWordsChart();
        createAbsurdityChart(data);
        createTimelineChart(data);
    });
}

// ============================================
// MUGSHOT PICTURE FRAME
// ============================================

function initMugshotFrame() {
    const container = document.getElementById('mugshot-container');
    if (!container) return;

    // Available mugshot images - all 19
    const mugshots = [
        'mugshots/man_1.png',
        'mugshots/man_2.png',
        'mugshots/man_3.png',
        'mugshots/man_4.png',
        'mugshots/man_5.png',
        'mugshots/man_6.png',
        'mugshots/man_7.png',
        'mugshots/man_8.png',
        'mugshots/man_9.png',
        'mugshots/man_10.png',
        'mugshots/man_11.png',
        'mugshots/man_12.png',
        'mugshots/man_13.png',
        'mugshots/man_14.png',
        'mugshots/man_15.png',
        'mugshots/man_16.png',
        'mugshots/man_17.png',
        'mugshots/man_18.png',
        'mugshots/man_19.png'
    ];

    // Shuffle so no two adjacent are the same
    function shuffleNoAdjacent(arr) {
        const result = [];
        const available = [...arr];
        
        while (available.length > 0) {
            // Filter out the last one we added
            const lastAdded = result[result.length - 1];
            const choices = available.filter(x => x !== lastAdded);
            
            if (choices.length === 0) {
                // Edge case: swap with earlier element
                const pick = available[0];
                available.splice(0, 1);
                result.push(pick);
            } else {
                const pick = choices[Math.floor(Math.random() * choices.length)];
                available.splice(available.indexOf(pick), 1);
                result.push(pick);
            }
        }
        return result;
    }

    const track = document.createElement('div');
    track.className = 'mugshot-track';
    container.appendChild(track);

    const mugshotSize = 60;
    
    // More mugshots for a fuller belt
    const numMugshots = 52;
    
    // Create sequence with no adjacent duplicates
    let sequence = shuffleNoAdjacent(mugshots);
    // Extend sequence to fill numMugshots, ensuring no adjacent duplicates
    while (sequence.length < numMugshots) {
        let nextOptions = mugshots.filter(m => m !== sequence[sequence.length - 1]);
        sequence.push(nextOptions[Math.floor(Math.random() * nextOptions.length)]);
    }
    // Also ensure first and last aren't the same (since it loops)
    while (sequence[0] === sequence[sequence.length - 1]) {
        let nextOptions = mugshots.filter(m => m !== sequence[sequence.length - 2] && m !== sequence[0]);
        sequence[sequence.length - 1] = nextOptions[Math.floor(Math.random() * nextOptions.length)];
    }
    
    // Create mugshot elements
    sequence.forEach(src => {
        const img = document.createElement('div');
        img.className = 'mugshot-frame';
        img.style.backgroundImage = `url(${src})`;
        track.appendChild(img);
    });

    let globalProgress = 0;
    const speed = 0.3; // Slower for smoother feel
    let lastTime = 0;
    
    function animate(currentTime) {
        // Delta time for consistent speed regardless of frame rate
        const deltaTime = lastTime ? (currentTime - lastTime) / 16.67 : 1;
        lastTime = currentTime;
        
        const trackRect = track.getBoundingClientRect();
        const w = trackRect.width;
        const h = trackRect.height;
        const perimeter = 2 * w + 2 * h;
        
        // Update global progress with delta time
        globalProgress = (globalProgress + speed * deltaTime) % perimeter;
        
        // Position each mugshot evenly around perimeter
        const spacing = perimeter / numMugshots;
        
        Array.from(track.children).forEach((el, i) => {
            let pos = (i * spacing + globalProgress) % perimeter;
            
            let x, y;
            const halfSize = mugshotSize / 2;
            
            if (pos < w) {
                // Top edge: moving right
                x = pos - halfSize;
                y = -halfSize;
            } else if (pos < w + h) {
                // Right edge: moving down
                x = w - halfSize;
                y = (pos - w) - halfSize;
            } else if (pos < 2 * w + h) {
                // Bottom edge: moving left
                x = w - (pos - w - h) - halfSize;
                y = h - halfSize;
            } else {
                // Left edge: moving up
                x = -halfSize;
                y = h - (pos - 2 * w - h) - halfSize;
            }
            
            el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        });
        
        requestAnimationFrame(animate);
    }
    
    // Start animation
    requestAnimationFrame(animate);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initScrollama();
    initMugshotFrame();
});
function updateGeographyText(data) {
    const total = data.total || 1;
    const withLocation = data.totalWithLocation || 0;
    const topLocations = Object.entries(data.locations || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

    const fmt = (n) => n.toLocaleString();
    const cleanName = (n) => n.replace(', FL', '');
    const narrative = topLocations.length
        ? `Only <strong>${fmt(withLocation)}</strong> headlines name a specific location.* <strong>${cleanName(topLocations[0].name)}</strong> leads with <strong>${fmt(topLocations[0].value)}</strong> headlines${topLocations[1] ? `, followed by <strong>${cleanName(topLocations[1].name)}</strong>` : ''}${topLocations[2] ? ` and <strong>${cleanName(topLocations[2].name)}</strong>.` : '.'}`
        : 'Most headlines do not name a specific location.';

    const el = document.getElementById('geography-narrative');
    if (el) el.innerHTML = narrative;
}

// Seasonal trends narrative (aggregated by month across all years)
function updateSeasonalText(data) {
    const monthlyTotals = Array(12).fill(0);
    let withDate = 0;
    Object.entries(data.byMonth || {}).forEach(([key, value]) => {
        const parts = key.split('-'); // YYYY-MM
        const monthIdx = parseInt(parts[1], 10) - 1;
        if (monthIdx >= 0 && monthIdx < 12) {
            monthlyTotals[monthIdx] += value;
            withDate += value;
        }
    });

    const monthsFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const maxIdx = monthlyTotals.indexOf(Math.max(...monthlyTotals));
    const minIdx = monthlyTotals.indexOf(Math.min(...monthlyTotals));
    const maxMonth = monthsFull[maxIdx] || '';
    const minMonth = monthsFull[minIdx] || '';
    const maxCount = monthlyTotals[maxIdx] || 0;
    const minCount = monthlyTotals[minIdx] || 0;

    const el = document.getElementById('seasonal-narrative');
    if (!el) return;

    el.innerHTML = `Aggregated across years, <strong>${maxMonth}</strong> is the busiest month with <strong>${maxCount.toLocaleString()}</strong> headlines, while <strong>${minMonth}</strong> is the quietest at <strong>${minCount.toLocaleString()}</strong>.`;
}
