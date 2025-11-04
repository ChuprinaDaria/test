import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Edit3, Loader2 } from "lucide-react";
import { clientAPI } from "../../api/client";
import KnowledgeBlockEditModal from "./KnowledgeBlockEditModal";
import KnowledgeBlockAddModal from "./KnowledgeBlockAddModal";

const KnowledgeBlocks = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    setLoading(true);
    try {
      const response = await clientAPI.getKnowledgeBlocks();
      const blocksData = response.data || [];
      
      // Перетворюємо дані з API
      const formattedBlocks = blocksData.map((block) => ({
        id: block.id,
        name: block.name,
        description: block.description || "",
        entries: block.entries_count || 0,
        active: block.is_active,
        permanent: block.is_permanent,
        ...block, // Зберігаємо всі дані для редагування
      }));
      
      setBlocks(formattedBlocks);
    } catch (error) {
      console.error("Failed to load knowledge blocks:", error);
      // Fallback на мок дані тільки "Clients Chats"
      setBlocks([
        { id: 0, name: "Clients Chats", entries: 0, active: true, permanent: true, is_permanent: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (id) => {
    const block = blocks.find((b) => b.id === id);
    if (!block || block.permanent) return;

    try {
      await clientAPI.updateKnowledgeBlock(id, {
        is_active: !block.active,
      });
      setBlocks(
        blocks.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
      );
    } catch (error) {
      console.error("Failed to toggle block:", error);
    }
  };

  const handleCreateBlock = async (name, description) => {
    try {
      const response = await clientAPI.createKnowledgeBlock({
        name,
        description,
        is_active: true,
      });
      await loadBlocks();
      setShowAddModal(false);
    } catch (error) {
      console.error("Failed to create block:", error);
      alert(t("knowledgeBlocks.createError") || "Failed to create knowledge block");
    }
  };

  const handleEditBlock = (block) => {
    setEditingBlock(block);
  };

  const handleSaveBlock = () => {
    loadBlocks();
    setEditingBlock(null);
  };

  const handleDeleteBlock = async (id) => {
    if (!confirm(t("knowledgeBlocks.deleteConfirm") || "Are you sure you want to delete this block?")) {
      return;
    }

    try {
      await clientAPI.deleteKnowledgeBlock(id);
      await loadBlocks();
    } catch (error) {
      console.error("Failed to delete block:", error);
      alert(t("knowledgeBlocks.deleteError") || "Failed to delete knowledge block");
    }
  };

  return (
    <>
      <div className="card">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-semibold text-accent-900">
            {t("knowledgeBlocks.title")}
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 bg-accent-900 text-white rounded-lg hover:bg-accent-800 transition text-sm font-medium"
          >
            {t("knowledgeBlocks.add")}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin text-primary-500" size={24} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`border border-accent-200 rounded-xl p-4 ${
                  block.permanent
                    ? "bg-accent-100 border-accent-300"
                    : "bg-accent-50 hover:bg-accent-100"
                } transition`}
              >
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-accent-900">{block.name}</p>
                      {block.permanent && (
                        <span className="text-xs bg-accent-200 text-accent-700 px-2 py-0.5 rounded">
                          Permanent
                        </span>
                      )}
                    </div>
                    {block.description && (
                      <p className="text-xs text-accent-600 mt-1 line-clamp-2">
                        {block.description}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    {!block.permanent && (
                      <button
                        onClick={() => handleEditBlock(block)}
                        className="flex items-center gap-1 text-accent-900 text-sm font-medium hover:underline"
                      >
                        <Edit3 size={14} />
                        {t("knowledgeBlocks.edit")}
                      </button>
                    )}
                    {block.permanent && <div></div>}

                    {/* Toggle switch - disabled для permanent блоків */}
                    <label
                      className={`relative inline-flex items-center ${
                        block.permanent
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={block.active}
                        onChange={() => toggleBlock(block.id)}
                        disabled={block.permanent}
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
        )}
      </div>

      {/* Edit Modal */}
      {editingBlock && (
        <KnowledgeBlockEditModal
          block={editingBlock}
          isOpen={!!editingBlock}
          onClose={() => setEditingBlock(null)}
          onSave={handleSaveBlock}
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <KnowledgeBlockAddModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleCreateBlock}
        />
      )}
    </>
  );
};

export default KnowledgeBlocks;
