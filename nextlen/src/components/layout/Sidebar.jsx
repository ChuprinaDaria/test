import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  FlaskConical,
  Plug2,
  MessageSquare,
  Settings,
  CreditCard
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
  const { t } = useTranslation();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/training', icon: GraduationCap, label: t('nav.training') },
    { to: '/sandbox', icon: FlaskConical, label: t('nav.sandbox') },
    { to: '/history', icon: MessageSquare, label: t('nav.history') },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
