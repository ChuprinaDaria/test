import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FileUpload from '../components/training/FileUpload';
import FileList from '../components/training/FileList';
import PromptEditor from '../components/training/PromptEditor';
import SyncActions from '../components/training/SyncActions';
import ModelStatusCard from '../components/training/ModelStatusCard';
import KnowledgeBlocks from '../components/training/KnowledgeBlocks';

const TrainingPage = () => {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);

  const handleFileUpload = (newFiles) => {
    setFiles([...files, ...newFiles]);
  };

  const handleDeleteFile = (fileId) => {
    setFiles(files.filter(f => f.id !== fileId));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('training.title')}</h1>
          <p className="text-gray-600">{t('training.subtitle')}</p>
        </div>
        <SyncActions />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FileUpload onUpload={handleFileUpload} />
          <FileList files={files} onDelete={handleDeleteFile} />
          <PromptEditor />
        </div>
        <div className="space-y-6">
          <ModelStatusCard />
          <KnowledgeBlocks />
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;
