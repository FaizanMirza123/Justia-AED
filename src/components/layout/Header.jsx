import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getStatesList } from "../../api/aedLawsApi";

/* Product categories */
const CATEGORIES = [
  { value: "48", label: "Training" },
  { value: "39", label: "  Philips Accessories" },
  { value: "38", label: "  Cardiac Science Accessories" },
  { value: "37", label: "  Zoll Accessories" },
  { value: "36", label: "AED Accessories" },
  { value: "33", label: "AED Cabinets and Signs" },
  { value: "32", label: "AEDs and Defibrillators" },
  { value: "31", label: "  Mobilize Rescue Systems" },
  { value: "30", label: "Bleeding Control/Trauma" },
  { value: "29", label: "  HeartStart Onsite" },
  { value: "28", label: "  HeartStart FRx" },
  { value: "27", label: "  Powerheart G5" },
  { value: "26", label: "Data Management" },
  { value: "25", label: "  Zoll AED 3" },
  { value: "24", label: "  Zoll AED Plus" },
  { value: "23", label: "Philips Products" },
  { value: "22", label: "  PHILIPS" },
  { value: "21", label: "Cardiac Science Products" },
  { value: "20", label: "  CARDIAC SCIENCE" },
  { value: "19", label: "ZOLL Products" },
  { value: "18", label: "  ZOLL" },
];

/* Nav items */
const NAV_ITEMS = [
  { label: "AED Accessories", href: "/shop" },
  { label: "AED Navigator", href: "/aednavigator" },
  { label: "About Us", href: "/aboutus" },
  { label: "Classes", href: "/classes" },
  {
    label: "Resources",
    href: "#",
    children: [
      { label: "Videos", href: "/videos" },
      { label: "Our Blogs", href: "/our-blogs" },
    ],
  },
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact-us" },
];

/* Icon — Font Awesome, white, gold on hover, optional grow */
const NavIcon = ({ icon, href, grow = false }) => {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      style={{ margin: "12px", display: "inline-block", lineHeight: 1 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <i
        className={`fas fa-${icon}`}
        style={{
          fontSize: "25px",
          color: hov ? "#FFD700" : "#FFFFFF",
          transition: "color .3s, transform .3s",
          transform: grow && hov ? "scale(1.3)" : "scale(1)",
          display: "block",
        }}
      />
    </a>
  );
};

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [allStates, setAllStates] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    getStatesList()
      .then(setAllStates)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    const q = query.toLowerCase();
    setSuggestions(
      allStates.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8),
    );
  }, [query, allStates]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      navigate(`/aed-laws/${suggestions[0].slug}`);
      setQuery("");
      setShowSuggestions(false);
    }
  };

  const handleSelect = (slug) => {
    navigate(`/aed-laws/${slug}`);
    setQuery("");
    setShowSuggestions(false);
  };

  return (
    <div className="w-full">
      {/* TOP SECTION logo + search */}
      <div
        className="w-full border-b"
        style={{ backgroundColor: "#d6dcea", borderColor: "#0A1A33" }}
      >
        <div className="mx-auto p-[10px] flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo (50%) */}
          <div className="flex-1 flex items-center p-[10px]">
            <Link to="/">
              <img
                src="logo.png"
                width="258.3px"
                height="87.65px"
                alt="AED Logo"
                className="object-contain"
              />
            </Link>
          </div>

          {/* Search bar (50%) */}
          <div className="flex-1 flex items-center justify-end p-[10px]">
            <div
              ref={searchRef}
              style={{ position: "relative", width: "738px" }}
            >
              <form
                onSubmit={handleSearch}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  height: "53.2px",
                  border: "2px solid #E6E6E6",
                  overflow: "hidden",
                  background: "#E6E6E6",
                }}
              >
                {/* Search button */}
                <button
                  type="submit"
                  style={{
                    flexShrink: 0,
                    width: "75px",
                    height: "100%",
                    background: "#E6E6E6",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    paddingLeft: "25px",
                    paddingRight: "25px",
                  }}
                >
                  <i
                    className="fas fa-search"
                    style={{ fontSize: "18px", color: "#3E3E3E" }}
                  />
                </button>

                {/* Text input */}
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search for States..."
                  style={{
                    flex: 1,
                    height: "100%",
                    background: "#ffffff",
                    border: "none",
                    outline: "none",
                    padding: "0 15px",
                    fontSize: "16px",
                    fontWeight: "400",
                    color: "#3E3E3E",
                  }}
                />
              </form>

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#ffffff",
                    border: "1px solid #E6E6E6",
                    borderTop: "none",
                    zIndex: 9999,
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  {suggestions.map((state) => (
                    <li
                      key={state.slug}
                      onMouseDown={() => handleSelect(state.slug)}
                      style={{
                        padding: "10px 16px",
                        cursor: "pointer",
                        fontSize: "15px",
                        color: "#3E3E3E",
                        borderBottom: "1px solid #F0F0F0",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f5f7ff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#ffffff")
                      }
                    >
                      {state.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BLUE NAV BAR */}
      <header
        className="border-b flex items-center"
        style={{
          backgroundColor: "#111686",
          borderColor: "#0A1A33",
          height: "76.2px",
          padding: "10px 0",
        }}
      >
        {/* Desktop: 3-column (empty | nav | icons) */}
        <div
          className="hidden md:flex w-full items-center"
          style={{ height: "100%" }}
        >
          {/* Left: empty spacer */}
          <div style={{ flex: "0 0 11.5%" }} />

          {/* Centre: nav */}
          <nav
            className="flex items-center justify-between"
            style={{ flex: 1, height: "100%" }}
          >
            {NAV_ITEMS.map((item, index) => {
              const isFirst = index === 0;
              const isLast = index === NAV_ITEMS.length - 1;
              const hPadding = isFirst
                ? "13px 20px 13px 0"
                : isLast
                  ? "13px 0 13px 20px"
                  : "13px 20px";
              return item.children ? (
                <div
                  key={item.label}
                  className="relative group"
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <button
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "#FFFFFF",
                      fontSize: "16px",
                      fontWeight: "700",
                      padding: hPadding,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      height: "100%",
                    }}
                  >
                    {item.label}
                    <i
                      className="fas fa-caret-down"
                      style={{ fontSize: "12px" }}
                    />
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100"
                      style={{
                        backgroundColor: "#FFD700",
                        transition: "opacity .3s",
                      }}
                    />
                  </button>

                  {/* Submenu */}
                  <div
                    className="absolute hidden group-hover:block z-50"
                    style={{
                      top: "100%",
                      left: "0",
                      width: "12em",
                      backgroundColor: "#111686",
                      paddingTop: "10px",
                    }}
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        to={child.href}
                        style={{
                          display: "block",
                          padding: "8px 16px",
                          color: "#FFFFFF",
                          fontFamily: "Arial, sans-serif",
                          fontSize: "13px",
                          fontWeight: "bold",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                          backgroundColor: "#111686",
                          transition: "background-color .2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#0d1270")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "#111686")
                        }
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.label}
                  to={item.href}
                  className="relative group"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: "100%",
                    color: "#FFFFFF",
                    fontSize: "16px",
                    fontWeight: "700",
                    padding: hPadding,
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100"
                    style={{
                      backgroundColor: "#FFD700",
                      transition: "opacity .3s",
                    }}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right: icons */}
          <div
            className="hidden md:flex items-center justify-end"
            style={{ flex: "0 0 11.5%", paddingRight: "10px" }}
          >
            <NavIcon icon="map-marker-alt" href="#location" grow />
            <NavIcon icon="user-circle" href="/my-account" />
            <NavIcon icon="cart-arrow-down" href="/cart" />
          </div>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex w-full justify-end px-4">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              color: "#FFFFFF",
              fontSize: "24px",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {mobileOpen ? "✖" : "☰"}
          </button>
        </div>
      </header>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-[#111686] border-t border-[#0A1A33]">
          <nav className="flex flex-col p-4 space-y-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                style={{
                  color: "#FFFFFF",
                  fontSize: "16px",
                  fontWeight: "700",
                  textDecoration: "none",
                }}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};

export default Header;
