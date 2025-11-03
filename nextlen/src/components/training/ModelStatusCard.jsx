import { useTranslation } from "react-i18next";

const ModelStatusCard = () => {
  const { t } = useTranslation();

  // mock data
  const model = {
    status: "Active",
    lastUpdated: "2 days ago",
    version: "v3.2.1",
    dataSources: 6,
    knowledgeBlocks: 5,
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">
        {t("modelStatus.title")}
      </h3>

      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <p className="text-green-700 font-medium">
          ✓ {t("modelStatus.statusMessage", { status: model.status })}
        </p>
      </div>

      <div className="text-sm text-gray-700 space-y-1">
        <p>
          <strong>{t("modelStatus.lastUpdated")}:</strong> {model.lastUpdated}
        </p>
        <p>
          <strong>{t("modelStatus.version")}:</strong> {model.version}
        </p>
        <p>
          <strong>{t("modelStatus.dataSources")}:</strong> {model.dataSources}
        </p>
        <p>
          <strong>{t("modelStatus.knowledgeBlocks")}:</strong> {model.knowledgeBlocks}
        </p>
      </div>

      <button className="mt-4 w-full border rounded-lg py-2 hover:bg-gray-100 transition">
        {t("modelStatus.viewHistory")}
      </button>
    </div>
  );
};

export default ModelStatusCard;
