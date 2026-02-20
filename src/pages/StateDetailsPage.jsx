import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStateDetails } from "../api/aedLawsApi";

export default function StateDetailsPage() {
  const { slug } = useParams();
  const [stateData, setStateData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
            <p className="text-gray-800 leading-relaxed">
              {stateData.summary}
            </p>
          </div>
        )}

        {/* Laws Section */}
        {stateData.laws && stateData.laws.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#301a41] mb-6">
              State AED Laws
            </h2>
            <div className="space-y-6">
              {stateData.laws.map((law, index) => (
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
                        {law.title}
                      </a>
                    ) : (
                      law.title
                    )}
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {law.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
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
