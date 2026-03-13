import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStateDetails } from "../api/aedLawsApi";

// ─── Classification ────────────────────────────────────────────────────────

// Topics — only laws matching at least one topic are shown
const TOPIC_KEYWORDS = {
  AED: ["automated external defibrillator", "aed", "defibrillator"],
  "CPR Training": [
    "cardiopulmonary resuscitation",
    "cpr training",
    "cpr certification",
    "resuscitation training",
    "basic life support",
    "bls training",
  ],
  "Trauma Kits": [
    "trauma kit",
    "bleeding control",
    "tourniquet",
    "hemostatic",
    "stop the bleed",
    "hemorrhage control",
  ],
};

// Industries — keywords pointing to a specific regulated group
const INDUSTRY_KEYWORDS = {
  "K-12 Education": [
    "school",
    "student",
    "k-12",
    "k\u201312",
    "elementary",
    "secondary",
    "middle school",
    "high school",
    "teacher",
    "classroom",
    "school district",
  ],
  Government: [
    "government",
    "governmental",
    "public building",
    "state agency",
    "municipality",
    "state facility",
    "government-owned",
    "public agency",
  ],
  "Health Club / Fitness Studio / Gym": [
    "health club",
    "fitness",
    "gym",
    "exercise facility",
    "athletic club",
    "recreation center",
  ],
  "Dental Office": ["dental", "dentist"],
  "Passenger Railways": [
    "railway",
    "railroad",
    "passenger rail",
    "transit authority",
    "rail car",
  ],
  "Assisted Living": [
    "assisted living",
    "nursing home",
    "long-term care",
    "residential care",
    "senior care",
  ],
  "Youth Sports / Athletics": [
    "youth sport",
    "youth athletics",
    "youth league",
    "interscholastic",
    "youth program",
  ],
};

// Signals that the law is broad / general-industry
const GENERAL_SIGNALS = [
  "good samaritan",
  "immunit",
  "any person",
  "public place",
  "newly constructed",
  "renovated",
];

/**
 * Classifies a law against allowed topics and industries.
 * Returns { include, topics, industries }
 */
function classifyLaw(law) {
  const haystack = (
    (law.title || "") +
    " " +
    (law.description || "")
  ).toLowerCase();

  const topics = Object.entries(TOPIC_KEYWORDS)
    .filter(([, kws]) => kws.some((kw) => haystack.includes(kw)))
    .map(([topic]) => topic);

  if (topics.length === 0) {
    return { include: false, topics: [], industries: [] };
  }

  const industries = Object.entries(INDUSTRY_KEYWORDS)
    .filter(([, kws]) => kws.some((kw) => haystack.includes(kw)))
    .map(([industry]) => industry);

  if (
    industries.length === 0 ||
    GENERAL_SIGNALS.some((sig) => haystack.includes(sig))
  ) {
    if (!industries.includes("General Industry")) {
      industries.unshift("General Industry");
    }
  }

  return { include: true, topics, industries };
}

const ALL_TOPICS = Object.keys(TOPIC_KEYWORDS);
const ALL_INDUSTRIES = ["General Industry", ...Object.keys(INDUSTRY_KEYWORDS)];

// ─── Text helpers ──────────────────────────────────────────────────────────
function formatTitle(title) {
  if (!title) return "";
  // Remove a dangling open parenthesis / bracket at the end
  return title.replace(/[\s\(\[]+$/, "").trim();
}

const WORD_LIMIT = 150;

function formatDescription(text) {
  if (!text) return "";
  
  // Collapse all continuous whitespace and newlines from the DB to standard spacing
  let cleaned = text.replace(/\s+/g, " ").trim();

  // Find list markers like (1), (a), (A), (i), (ii)
  // ONLY split them into a new line if they immediately follow punctuation (meaning they aren't inline references)
  cleaned = cleaned.replace(/([.:;])\s+(\([a-zA-Z0-9]{1,5}\))\s+(?=[A-Za-z])/g, "$1\n$2 ");

  const fragments = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
  
  const finalLines = [];
  for (let line of fragments) {
    // Clean endings: convert trailing "; and", "; or", "and", "or", or ";" into a clean period.
    line = line.replace(/[;:]?\s*\b(and|or)\b\s*$/i, '.').replace(/;\s*$/, '.');
    
    // Ignore lines that evaluate to just a marker
    if (/^\([a-zA-Z0-9]{1,5}\)\s*[.,;:]*$/.test(line)) continue;
    
    // Clean up specific known crawler artifact fragments
    if (/^\([a-zA-Z0-9]{1,5}\)\s*[,.:;]?\s*(and|or|of\s+Section|Pursuant\s+to\s+subdivision)\b/i.test(line) && line.length < 80) continue;
    if (/^\([a-zA-Z0-9]{1,5}\)\s*,\s*and\s+complies\s+with\s+subdivision/i.test(line)) continue;

    // Deduplicate identical sequential sentences
    if (finalLines.length > 0 && finalLines[finalLines.length - 1] === line) continue;

    finalLines.push(line);
  }

  // Use exactly double newlines to render as a single empty line gap between paragraphs
  return finalLines.join('\n\n');
}

function LawDescription({ text }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  const formatted = formatDescription(text);
  const words = formatted.split(/\s+/);
  const isLong = words.length > WORD_LIMIT;
  const displayed =
    isLong && !expanded
      ? words.slice(0, WORD_LIMIT).join(" ") + "\u2026"
      : formatted;

  return (
    <div>
      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
        {displayed}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 text-sm font-medium text-[#111686] hover:underline focus:outline-none"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function StateDetailsPage() {
  const { slug } = useParams();
  const [stateData, setStateData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeIndustry, setActiveIndustry] = useState(null);
  const navigate = useNavigate();

  const hasFilter = activeTopic !== null || activeIndustry !== null;

  function clearFilters() {
    setActiveTopic(null);
    setActiveIndustry(null);
  }

  useEffect(() => {
    setLoading(true);
    setError(null);

    getStateDetails(slug)
      .then((data) => {
        setStateData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-12 lg:px-24 xl:px-48">
        <div className="max-w-[75rem] mx-auto bg-white rounded-2xl shadow-lg p-8">
          <p className="text-center text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-12 lg:px-24 xl:px-48">
        <div className="max-w-[75rem] mx-auto bg-white rounded-2xl shadow-lg p-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 px-4 py-2 bg-[#111686] text-white rounded-lg hover:bg-[#0d1270] transition-colors duration-200"
          >
            ← Back to Map
          </button>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-semibold mb-2">Error</p>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stateData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-12 lg:px-24 xl:px-48">
      <div className="max-w-[75rem] mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-4 py-2 bg-[#111686] text-white rounded-lg hover:bg-[#0d1270] transition-colors duration-200"
        >
          ← Back to Map
        </button>

        {/* State Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {stateData.name} AED Laws
        </h1>

        {/* Summary */}
        {stateData.summary && (
          <div className="bg-[#f0f2fd] border-l-4 border-[#111686] p-4 rounded-md mb-8">
            <p className="text-gray-800 leading-relaxed">{stateData.summary}</p>
          </div>
        )}

        {/* ── Two-column layout: Laws + Filter Sidebar ── */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Laws Column */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-lg p-6 lg:p-8 order-2 md:order-1">
            {stateData.laws && stateData.laws.length > 0 ? (
              (() => {
                const seenTitles = new Set();
                const uniqueLaws = stateData.laws.filter((law) => {
                  const key = (law.title || "").trim().toLowerCase();
                  if (seenTitles.has(key)) return false;
                  seenTitles.add(key);
                  return true;
                });

                const visibleLaws = uniqueLaws.filter((law) => {
                  const cls = classifyLaw(law);
                  if (!cls.include) return false;
                  if (activeTopic && !cls.topics.includes(activeTopic))
                    return false;
                  if (activeIndustry && !cls.industries.includes(activeIndustry))
                    return false;
                  return true;
                });

                return visibleLaws.length > 0 ? (
                  <div>
                    {/* Active filter badges */}
                    {hasFilter && (
                      <div className="flex flex-wrap items-center gap-2 mb-5">
                        <span className="text-sm text-gray-500">Showing:</span>
                        {activeTopic && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#111686] text-white text-xs rounded-full font-medium">
                            {activeTopic}
                            <button
                              onClick={() => setActiveTopic(null)}
                              className="hover:text-gray-300"
                              aria-label="Clear topic filter"
                            >
                              ×
                            </button>
                          </span>
                        )}
                        {activeIndustry && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0d1270] text-white text-xs rounded-full font-medium">
                            {activeIndustry}
                            <button
                              onClick={() => setActiveIndustry(null)}
                              className="hover:text-gray-300"
                              aria-label="Clear industry filter"
                            >
                              ×
                            </button>
                          </span>
                        )}
                      </div>
                    )}

                    <h2 className="text-2xl font-semibold text-[#111686] mb-6">
                      State AED Laws
                    </h2>
                    <div className="space-y-6">
                      {visibleLaws.map((law, index) => (
                        <div
                          key={index}
                          className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                        >
                          <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            {law.justia_url ? (
                              <a
                                href={law.justia_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#111686] hover:underline"
                              >
                                {formatTitle(law.title)}
                              </a>
                            ) : (
                              formatTitle(law.title)
                            )}
                          </h3>
                          <LawDescription text={law.description} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 italic">
                    No laws found for the selected filters.
                  </p>
                );
              })()
            ) : (
              <p className="text-gray-600 italic">
                No specific laws found for this state.
              </p>
            )}
          </div>

          {/* ── Filter Sidebar ── */}
          <div className="w-full md:w-64 flex-shrink-0 sticky top-6 order-1 md:order-2">
            {/* Filter panel */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col gap-6">
              
              {/* Topic section */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Topic</h3>
                <div className="flex flex-col gap-2.5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="topic"
                      checked={activeTopic === null}
                      onChange={() => setActiveTopic(null)}
                      className="w-4 h-4 text-[#111686] border-gray-300 focus:ring-[#111686] cursor-pointer"
                    />
                    <span className={`text-sm ${activeTopic === null ? 'font-medium text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>All Topics</span>
                  </label>
                  {ALL_TOPICS.map((topic) => (
                    <label key={topic} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="topic"
                        checked={activeTopic === topic}
                        onChange={() => setActiveTopic(topic)}
                        className="w-4 h-4 text-[#111686] border-gray-300 focus:ring-[#111686] cursor-pointer"
                      />
                      <span className={`text-sm ${activeTopic === topic ? 'font-medium text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>{topic}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Industry section */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Industry</h3>
                <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="industry"
                      checked={activeIndustry === null}
                      onChange={() => setActiveIndustry(null)}
                      className="w-4 h-4 text-[#111686] border-gray-300 focus:ring-[#111686] cursor-pointer"
                    />
                    <span className={`text-sm ${activeIndustry === null ? 'font-medium text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>All Industries</span>
                  </label>
                  {ALL_INDUSTRIES.map((ind) => (
                    <label key={ind} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="industry"
                        checked={activeIndustry === ind}
                        onChange={() => setActiveIndustry(ind)}
                        className="w-4 h-4 text-[#111686] border-gray-300 focus:ring-[#111686] cursor-pointer"
                      />
                      <span className={`text-sm ${activeIndustry === ind ? 'font-medium text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>{ind}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear all */}
              {hasFilter && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={clearFilters}
                    className="w-full py-2 px-4 text-sm font-semibold text-white bg-[#111686] hover:bg-[#0d1270] rounded-lg transition-colors duration-200"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
