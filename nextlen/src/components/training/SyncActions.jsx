import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const SyncActions = () => {
  const { t } = useTranslation();
  const [syncing, setSyncing] = useState(false);
  const [retraining, setRetraining] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1500); // mock delay
  };

  const handleRetrain = () => {
    setRetraining(true);
    setTimeout(() => setRetraining(false), 2000); // mock delay
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
