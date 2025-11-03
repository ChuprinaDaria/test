import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Edit3 } from "lucide-react";

const mockBlocks = [
  { id: 1, name: "Wine Recommendations", entries: 45, active: true },
  { id: 2, name: "Chef's Specials", entries: 12, active: true },
  { id: 3, name: "Dietary Restrictions", entries: 28, active: true },
  { id: 4, name: "Seasonal Ingredients", entries: 34, active: true },
  { id: 5, name: "Reservation Policies", entries: 8, active: false },
];

const KnowledgeBlocks = () => {
  const [blocks, setBlocks] = useState(mockBlocks);
  const { t } = useTranslation();

  const toggleBlock = (id) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, active: !b.active } : b)));
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-semibold text-accent-900">
          {t("knowledgeBlocks.title")}
        </h3>
        <button className="px-3 py-2 bg-accent-900 text-white rounded-lg hover:bg-accent-800 transition text-sm font-medium">
          {t("knowledgeBlocks.add")}
        </button>
      </div>

      {/* Blocks grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {blocks.map((block) => (
          <div
            key={block.id}
            className="border border-accent-200 rounded-xl p-4 bg-accent-50 hover:bg-accent-100 transition"
          >
            <div className="flex flex-col justify-between h-full">
              <div>
                <p className="font-medium text-accent-900">{block.name}</p>
                <p className="text-sm text-accent-500">
                  {t("knowledgeBlocks.entries", { count: block.entries })}
                </p>
              </div>

              <div className="flex justify-between items-center mt-4">
                <button className="flex items-center gap-1 text-accent-900 text-sm font-medium hover:underline">
                  <Edit3 size={14} />
                  {t("knowledgeBlocks.edit")}
                </button>

                {/* Toggle switch */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={block.active}
                    onChange={() => toggleBlock(block.id)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-accent-300 rounded-full peer peer-checked:bg-accent-900 transition-colors"></div>
                  <div className="absolute left-[2px] top-[2px] bg-white w-4 h-4 rounded-full shadow-md transition-transform peer-checked:translate-x-4"></div>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnowledgeBlocks;
