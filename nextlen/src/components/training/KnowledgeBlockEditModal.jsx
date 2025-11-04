import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Upload, FileText, Loader2 } from "lucide-react";
import { clientAPI } from "../../api/client";

const KnowledgeBlockEditModal = ({ block, isOpen, onClose, onSave }) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (block) {
      setName(block.name || "");
      setDescription(block.description || "");
    }
  }, [block]);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles([...files, ...selectedFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!block) return;

    setSaving(true);
    try {
      // Оновлюємо блок
      const updatedBlock = await clientAPI.updateKnowledgeBlock(block.id, {
        name,
        description,
      });

      // Завантажуємо файли
      if (files.length > 0) {
        setUploading(true);
        for (const file of files) {
          await clientAPI.addDocumentToBlock(block.id, file, file.name);
        }
        setUploading(false);
      }

      onSave(updatedBlock.data);
      onClose();
    } catch (error) {
      console.error("Failed to save block:", error);
      alert(t("knowledgeBlocks.saveError") || "Failed to save knowledge block");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {t("knowledgeBlocks.editBlock")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("knowledgeBlocks.blockName")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t("knowledgeBlocks.blockNamePlaceholder")}
              disabled={block?.is_permanent}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("knowledgeBlocks.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24 resize-none"
              placeholder={t("knowledgeBlocks.descriptionPlaceholder")}
              disabled={block?.is_permanent}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("knowledgeBlocks.addDocuments")}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="block-files"
                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.json"
                disabled={block?.is_permanent}
              />
              <label
                htmlFor="block-files"
                className={`flex flex-col items-center cursor-pointer ${
                  block?.is_permanent ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Upload className="text-gray-400 mb-2" size={24} />
                <span className="text-sm text-gray-600">
                  {t("knowledgeBlocks.clickToUpload")}
                </span>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-2 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-700"
                      disabled={block?.is_permanent}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            disabled={saving}
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading || block?.is_permanent}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving || uploading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                {uploading
                  ? t("knowledgeBlocks.uploading")
                  : t("knowledgeBlocks.saving")}
              </>
            ) : (
              t("knowledgeBlocks.save")
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBlockEditModal;

