const AEDOverview = () => {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      {/* Centered heading */}
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-left space-y-4 mb-6">
        AED Legislation Summaries and Requirements by State
      </h2>

      {/* Left-aligned paragraphs */}
      <div className="text-left space-y-4 text-gray-600 text-lg leading-relaxed">
        <p>
          To help improve Sudden Cardiac Arrest outcomes and encourage groups to
          buy AEDs, all 50 states have “Good Samaritan” legislation in place to
          offer civil liability protection for those who buy or use them.
          Additionally, some states have additional laws requiring AEDs for
          certain facility types, like schools, gyms, or large buildings.
        </p>

        <p>
          Each state’s laws vary significantly. It’s important to understand these
          regulations to know if you must have an AED and how to maintain it
          properly, to maximize the value of liability protections available.
        </p>

        <p>
          Click on your state to learn about the AED requirements and protections available to you.
        </p>
      </div>
    </div>
  );
};

export default AEDOverview;
