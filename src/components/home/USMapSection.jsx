import USMap from "../USMap";

const USMapSection = ({ loading }) => {
  return loading ? (
    <div className="flex items-center justify-center h-96 pt-5">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
    </div>
  ) : (
    <div className="w-full h-auto mb-12 pt-16">
      <USMap />
    </div>
  );
};

export default USMapSection;
