import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StatesList = ({ states }) => {
  const navigate = useNavigate();

  return (
    <div className="mt-16">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
        All AED State Laws
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-3 text-sm">
        {states.map((s) => (
          <div
            key={s.slug}
            className="flex items-center gap-2 cursor-pointer hover:text-[#111686]"
            onClick={() => navigate(`/aed-laws/${s.slug}`)}
          >
            <MapPin className="w-4 h-4 text-blue-600" />
            {s.name} AED laws
          </div>
        ))}
      </div>
      {/* Highlighted paragraph */}
     <div className="mb-10 pt-16 flex justify-center">
  <p className="text-left space-y-4 text-gray-900 border-l-4 border-blue-600 p-4 rounded-md text-sm sm:text-sm max-w-md">
    <strong>This information is for informational purposes only and not intended as legal advice.</strong> 
    While we make every attempt to ensure the accuracy of the information provided, AED laws and requirements change frequently. 
    We encourage you to refer to your legal counsel or state agencies with questions about your state's AED laws or AED Good Samaritan requirements.
  </p>
</div>

    </div>
    
  );
};

export default StatesList;
