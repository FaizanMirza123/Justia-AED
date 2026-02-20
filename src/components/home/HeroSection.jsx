import { useState, useRef, useEffect } from "react";
import { MapPin, Search, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = ({ states }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const filteredStates = states.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (slug) => {
    navigate(`/aed-laws/${slug}`);
    setDropdownOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="text-center mb-12 pt-16"> {/* Added top padding */}
      <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8"> {/* Bigger heading */}
        AED State Laws
      </h1>

      {/* DROPDOWN */}
      <div className="relative inline-block w-48 sm:w-52 pb-6" ref={dropdownRef}> {/* Narrower width & bottom padding */}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex justify-between items-center w-full bg-[#111686] text-white px-4 py-2 rounded-lg shadow-sm"
        >
          Choose your state
          <ChevronDown
            size={18}
            className={`transition-transform ${
              dropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute z-10 mt-2 w-full bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-2 flex items-center">
              <Search size={16} className="ml-2 text-gray-400" />
              <input
                type="text"
                placeholder="Search state..."
                className="w-full ml-2 px-2 py-1 text-sm focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="py-1">
              {filteredStates.map((s) => (
                <div
                  key={s.slug}
                  className="px-4 py-2 hover:bg-[#d6dcea] cursor-pointer text-gray-700 text-sm"
                  onClick={() => handleSelect(s.slug)}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#111686]" />
                    {s.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroSection;
