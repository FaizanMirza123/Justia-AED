import { useEffect, useState } from "react";
import { getStatesList } from "../api/aedLawsApi";

import HeroSection from "../components/home/HeroSection";
import AEDOverview from "../components/home/AEDOverview";
import USMapSection from "../components/home/USMapSection";
import StatesList from "../components/home/StatesList";

const HomePage = () => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStatesList().then((res) => {
      setStates(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <HeroSection states={states} />
        <AEDOverview />
        <USMapSection loading={loading} />
        {!loading && <StatesList states={states} />}
      </div>
    </div>
  );
};

export default HomePage;
