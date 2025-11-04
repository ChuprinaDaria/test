import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { clientAPI } from "../../api/client";

const SyncActions = () => {
  const { t } = useTranslation();
  const [syncing, setSyncing] = useState(false);
  const [retraining, setRetraining] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await clientAPI.syncData();
      const count = response.data?.documents_count || 0;
      alert(
        t("syncActions.syncSuccess") || 
        `Indexing started for ${count} new document(s)!`
      );
    } catch (error) {
      console.error("Failed to sync data:", error);
      alert(t("syncActions.syncError") || "Failed to sync data");
    } finally {
      setSyncing(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const response = await clientAPI.reindexData();
      const count = response.data?.documents_count || 0;
      alert(
        t("syncActions.retrainSuccess") || 
        `Reindexing started for ${count} document(s)!`
      );
    } catch (error) {
      console.error("Failed to retrain:", error);
      alert(t("syncActions.retrainError") || "Failed to retrain");
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handleSync}
        className="flex items-center gap-2 border rounded-lg px-4 py-2 hover:bg-gray-100 transition"
      >
        <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
        {syncing ? t("syncActions.syncing") : t("syncActions.sync")}
      </button>

      <button
        onClick={handleRetrain}
        className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg px-4 py-2 hover:opacity-90 transition"
      >
        <RefreshCw size={18} className={retraining ? "animate-spin" : ""} />
        {retraining ? t("syncActions.retraining") : t("syncActions.retrain")}
      </button>
    </div>
  );
};

export default SyncActions;
