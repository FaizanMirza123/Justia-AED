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
  // Insert a blank line before every (1), (2)…, (a), (b)… list marker
  return text.replace(/[ \t]*(\(\d+\)|\([a-zA-Z]\))[ \t]*/g, "\n\n$1 ").trim();
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
      <div className="min-h-screen bg-gray-50 py-12 px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          <p className="text-center text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
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
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
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

        {/* ── Filter Section ── */}
        <div className="mb-8 border border-gray-200 rounded-xl overflow-hidden">
          {/* Filter header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#f0f2fd] border-b border-gray-200">
            <div className="flex items-center gap-2 text-[#111686] font-semibold text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                />
              </svg>
              Filter Laws
            </div>
            {hasFilter && (
              <button
                onClick={clearFilters}
                className="text-xs text-[#111686] hover:underline font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Topic row */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
              Topic
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTopic(null)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors duration-150 ${
                  activeTopic === null
                    ? "bg-[#111686] text-white border-[#111686]"
                    : "text-gray-600 border-gray-300 hover:border-[#111686] hover:text-[#111686]"
                }`}
              >
                All
              </button>
              {ALL_TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() =>
                    setActiveTopic((prev) => (prev === topic ? null : topic))
                  }
                  className={`px-3 py-1 text-sm rounded-full border transition-colors duration-150 ${
                    activeTopic === topic
                      ? "bg-[#111686] text-white border-[#111686]"
                      : "text-gray-600 border-gray-300 hover:border-[#111686] hover:text-[#111686]"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Industry row */}
          <div className="px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
              Industry
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveIndustry(null)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors duration-150 ${
                  activeIndustry === null
                    ? "bg-[#111686] text-white border-[#111686]"
                    : "text-gray-600 border-gray-300 hover:border-[#111686] hover:text-[#111686]"
                }`}
              >
                All
              </button>
              {ALL_INDUSTRIES.map((ind) => (
                <button
                  key={ind}
                  onClick={() =>
                    setActiveIndustry((prev) => (prev === ind ? null : ind))
                  }
                  className={`px-3 py-1 text-sm rounded-full border transition-colors duration-150 ${
                    activeIndustry === ind
                      ? "bg-[#111686] text-white border-[#111686]"
                      : "text-gray-600 border-gray-300 hover:border-[#111686] hover:text-[#111686]"
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Laws Section */}
        {stateData.laws && stateData.laws.length > 0 ? (
          (() => {
            // Deduplicate by normalised title (case-insensitive, trimmed)
            const seenTitles = new Set();
            const uniqueLaws = stateData.laws.filter((law) => {
              const key = (law.title || "").trim().toLowerCase();
              if (seenTitles.has(key)) return false;
              seenTitles.add(key);
              return true;
            });

            // Classify each law and apply topic + industry filters
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
              <div className="mb-8">
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
              <div className="mb-8">
                <p className="text-gray-600 italic">
                  No laws found for the selected filters.
                </p>
              </div>
            );
          })()
        ) : (
          <div className="mb-8">
            <p className="text-gray-600 italic">
              No specific laws found for this state.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
