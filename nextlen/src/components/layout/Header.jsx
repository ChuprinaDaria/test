import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher';

const Header = () => {

  const { t } = useTranslation();


  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{t('dashboard.welcomeBack')}</h2>
          <p className="text-sm text-gray-500">{t('dashboard.manageAssistant')}</p>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />

        </div>
      </div>
    </header>
  );
};

export default Header;
