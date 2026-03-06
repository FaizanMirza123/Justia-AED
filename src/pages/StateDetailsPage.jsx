import React, { useEffect, useState } from "react";
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

function formatDescription(text) {
  if (!text) return "";

  // Truncate at 500 words
  const words = text.split(/\s+/);
  let processed =
    words.length > 500 ? words.slice(0, 500).join(" ") + "…" : text;

  // Insert a blank line before every (1), (2)…, (a), (b)… list marker
  // so that whitespace-pre-line renders them as separate paragraphs
  processed = processed.replace(
    /[ \t]*(\(\d+\)|\([a-zA-Z]\))[ \t]*/g,
    "\n\n$1 ",
  );

  return processed.trim();
}

// ─── Component ─────────────────────────────────────────────────────────────

const HEADER_HEIGHT = 204; // logo bar (~108px) + blue nav bar (~76px)
const FILTER_MIN_TOP = 24; // closest to top of viewport when scrolled down

export default function StateDetailsPage() {
  const { slug } = useParams();
  const [stateData, setStateData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeIndustry, setActiveIndustry] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterTop, setFilterTop] = useState(HEADER_HEIGHT);
  const navigate = useNavigate();

  const hasFilter = activeTopic !== null || activeIndustry !== null;

  function clearFilters() {
    setActiveTopic(null);
    setActiveIndustry(null);
  }

  // Scroll-linked position: slides from just below the header down to FILTER_MIN_TOP
  useEffect(() => {
    function handleScroll() {
      const top = Math.max(FILTER_MIN_TOP, HEADER_HEIGHT - window.scrollY);
      setFilterTop(top);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            className="mb-6 px-4 py-2 bg-[#301a41] text-white rounded-lg hover:bg-[#41245a] transition-colors duration-200"
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
      {/* ── Sticky Filter Panel (fixed to viewport) ───────────────────── */}
      <div
        className="fixed right-4 z-50"
        style={{
          top: filterTop,
          transition: "top 0.15s ease-out",
        }}
      >
        {/* Toggle button */}
        <button
          onClick={() => setFilterOpen((prev) => !prev)}
          className="flex items-center gap-2 px-4 py-2 bg-[#301a41] text-white rounded-lg shadow-lg hover:bg-[#41245a] transition-colors duration-200 text-sm font-medium"
        >
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
          {hasFilter ? "Filtered" : "Filter"}
        </button>

        {/* Dropdown panel */}
        {filterOpen && (
          <div className="mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
            {/* ── Topic section ── */}
            <div className="px-4 py-2.5 bg-[#f8f4fc] border-b border-gray-200">
              <p className="text-xs font-bold uppercase tracking-wide text-[#301a41]">
                Topic
              </p>
            </div>
            <ul className="divide-y divide-gray-100">
              <li>
                <button
                  onClick={() => setActiveTopic(null)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                    activeTopic === null
                      ? "bg-[#301a41] text-white font-semibold"
                      : "hover:bg-[#f8f4fc] text-gray-700"
                  }`}
                >
                  All Topics
                </button>
              </li>
              {ALL_TOPICS.map((topic) => (
                <li key={topic}>
                  <button
                    onClick={() =>
                      setActiveTopic((prev) => (prev === topic ? null : topic))
                    }
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                      activeTopic === topic
                        ? "bg-[#301a41] text-white font-semibold"
                        : "hover:bg-[#f8f4fc] text-gray-700"
                    }`}
                  >
                    {topic}
                  </button>
                </li>
              ))}
            </ul>

            {/* ── Industry section ── */}
            <div className="px-4 py-2.5 bg-[#f8f4fc] border-t border-b border-gray-200">
              <p className="text-xs font-bold uppercase tracking-wide text-[#301a41]">
                Industry
              </p>
            </div>
            <ul className="max-h-52 overflow-y-auto divide-y divide-gray-100">
              <li>
                <button
                  onClick={() => setActiveIndustry(null)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                    activeIndustry === null
                      ? "bg-[#301a41] text-white font-semibold"
                      : "hover:bg-[#f8f4fc] text-gray-700"
                  }`}
                >
                  All Industries
                </button>
              </li>
              {ALL_INDUSTRIES.map((ind) => (
                <li key={ind}>
                  <button
                    onClick={() =>
                      setActiveIndustry((prev) => (prev === ind ? null : ind))
                    }
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                      activeIndustry === ind
                        ? "bg-[#301a41] text-white font-semibold"
                        : "hover:bg-[#f8f4fc] text-gray-700"
                    }`}
                  >
                    {ind}
                  </button>
                </li>
              ))}
            </ul>

            {hasFilter && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => {
                    clearFilters();
                    setFilterOpen(false);
                  }}
                  className="text-xs text-[#301a41] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-4 py-2 bg-[#301a41] text-white rounded-lg hover:bg-[#41245a] transition-colors duration-200"
        >
          ← Back to Map
        </button>

        {/* State Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {stateData.name} AED Laws
        </h1>

        {/* Summary */}
        {stateData.summary && (
          <div className="bg-[#f8f4fc] border-l-4 border-[#301a41] p-4 rounded-md mb-8">
            <p className="text-gray-800 leading-relaxed">{stateData.summary}</p>
          </div>
        )}

        {/* Active filter badges */}
        {hasFilter && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">Showing:</span>
            {activeTopic && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#301a41] text-white text-xs rounded-full font-medium">
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#41245a] text-white text-xs rounded-full font-medium">
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
                <h2 className="text-2xl font-semibold text-[#301a41] mb-6">
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
                            className="text-[#301a41] hover:underline"
                          >
                            {formatTitle(law.title)}
                          </a>
                        ) : (
                          formatTitle(law.title)
                        )}
                      </h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {formatDescription(law.description)}
                      </p>
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
