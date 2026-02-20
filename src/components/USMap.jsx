import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getStatesList } from "../api/aedLawsApi";
import USMapSVG from "../assets/us-map.svg?react";

const USMap = () => {
  const [states, setStates] = useState([]);
  const [hoveredState, setHoveredState] = useState(null);
  const [tooltip, setTooltip] = useState({ name: "", x: 0, y: 0 });
  const [labelPositions, setLabelPositions] = useState([]);
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Fetch states list from API
  useEffect(() => {
    getStatesList().then(setStates);
  }, []);

  // Compute label positions for each path
  useEffect(() => {
    if (!svgRef.current) return;
    const paths = svgRef.current.querySelectorAll("path[id]");
    if (!paths.length) return;

    // Manual offsets for specific states to fix positioning issues
    const manualOffsets = {
      FL: { x: 35, y: 0 }, // Move Florida label/bubble more onto the peninsula
      MA: { x: -10, y: 5 }, // Move Mass right to clear space
      ID: { x: -10, y: 15 }, // Move Idaho left/down slightly to center better
      LA: { x: -15, y: 0 }, // Move Louisiana left
      MI: { x: 15, y: 30 },
      HI: { x: 195, y: 100 },
      AK: { x: 60, y: 0 },
      CA: { x: -10, y: 0 },
      // Michigan often needs help due to the lakes
      // Northeast separation (Bubbles)
      VT: { x: 0, y: 0 },

      NH: { x: -5, y: 5 },
      CT: { x: 0, y: 0 },
      RI: { x: 0, y: 5 },
      NJ: { x: 5, y: 0 },
      DE: { x: 0, y: 5 },
      MD: { x: 0, y: -5 },
      ME: { x: -5, y: 0 },
    };

    const positions = Array.from(paths)
      .map((path) => {
        const id = path.getAttribute("id");
        if (id === "DC") {
          path.style.display = "none"; // Hide DC path
          return null;
        }
        const box = path.getBBox();
        let x = box.x + box.width / 2;
        let y = box.y + box.height / 2;

        if (manualOffsets[id]) {
          x += manualOffsets[id].x;
          y += manualOffsets[id].y;
        }

        return { id, x, y };
      })
      .filter(Boolean);
    setLabelPositions(positions);
  }, [states]);

  // Set default styles
  useEffect(() => {
    const paths = svgRef.current?.querySelectorAll("path");
    if (!paths) return;
    paths.forEach((p) => {
      p.style.fill = "#d6dcea";
      p.style.stroke = "#ffffff";
      p.style.strokeWidth = "1";
      p.style.transition = "fill 0.25s ease";
    });
  }, []);

  const handleMouseEnter = (e) => {
    const id = e.target.id;
    const state = states.find((s) => s.abbreviation === id || s.name === id);
    if (state) setHoveredState(state);
  };

  const handleMouseMove = (e) => {
    if (!hoveredState) return;
    setTooltip({
      name: hoveredState.name,
      x: e.clientX + 12,
      y: e.clientY - 10,
    });
  };

  const handleMouseLeave = (e) => {
    // If cursor is still inside the SVG, do nothing
    if (svgRef.current && svgRef.current.contains(e.relatedTarget)) return;
    // Otherwise, clear hovered state and tooltip
    setHoveredState(null);
  };

  const handleClick = (e) => {
    // Check if the click target is a path (state shape) or circle (bubble)
    const id = e.target.getAttribute("data-state-id") || e.target.id;
    const state = states.find((s) => s.abbreviation === id || s.name === id);
    if (state) navigate(`/aed-laws/${state.slug}`);
  };

  const colorPalette = [
    "#d6dcea",
    "#c5d4f0",
    "#b5c7e8",
    "#a5bce0",
    "#dce3f5",
    "#ccd8ed",
    "#e0e7f5",
    "#bcc9e5",
    "#d0dbf0",
    "#c0cfe8",
  ];

  const getRandomColor = (index) => colorPalette[index % colorPalette.length];

  return (
    <>
      <div
        ref={containerRef}
        className="relative flex justify-center items-center bg-transparent overflow-hidden py-12 px-8"
      >
        <div
          className="relative w-full max-w-[1500px] -translate-x-10 sm:-translate-x-16 md:-translate-x-20 lg:-translate-x-28"
          style={{
            transformOrigin: "center",
            scale: "1.25", // makes map larger
          }}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 959 593"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            style={{ cursor: "pointer" }}
            onMouseLeave={handleMouseLeave} // ✅ ensure this is here
          >
            <USMapSVG
              className="w-full h-auto"
              onMouseOver={handleMouseEnter}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
            />
            {/* Path styles */}
            <style>
              {`
              path {
                transition: fill 0.25s ease, filter 0.25s ease;
                stroke: #fff;
                stroke-width: 1;
              }
              path:hover {
                fill: #aebcd6 !important;
                cursor: pointer;
              }
            `}
            </style>

            {/* Assign random color to each state */}
            {Array.from({ length: 51 }).map((_, i) => (
              <style key={i}>{`path:nth-of-type(${
                i + 1
              }) { fill: ${getRandomColor(i)}; }`}</style>
            ))}

            {/* Add text labels and bubbles for small states */}
            {labelPositions.map((pos) => {
              const st = states.find(
                (s) => s.abbreviation === pos.id || s.name === pos.id,
              );
              if (!st) return null;

              const shortLabel =
                st.abbreviation ||
                `${st.name[0]}${st.name[st.name.length - 1]}`.toUpperCase();

              return (
                <text
                  key={pos.id}
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  fontSize="7"
                  fill="#111686"
                  fontWeight="600"
                  style={{ pointerEvents: "none" }}
                >
                  {shortLabel}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Tooltip - Moved outside constraints */}
      {hoveredState && (
        <div
          className="fixed z-50 pointer-events-none bg-[#111686] text-white text-xs px-3 py-1.5 rounded shadow-lg"
          style={{
            top: tooltip.y,
            left: tooltip.x,
            transform: "translate(0, 0)", // Reset any transform
            whiteSpace: "nowrap",
          }}
        >
          {hoveredState.name}
        </div>
      )}
    </>
  );
};

export default USMap;
