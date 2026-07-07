'use client';

import {
  BookOpenIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import type { AdminTab } from '@/lib/types/admin';

const TABS: { id: AdminTab; name: string; icon: typeof ChartBarIcon }[] = [
  { id: 'overview', name: 'Översikt', icon: ChartBarIcon },
  { id: 'courses', name: 'Kurser', icon: BookOpenIcon },
  { id: 'users', name: 'Användare', icon: UsersIcon },
  { id: 'companies', name: 'Företag', icon: BuildingOfficeIcon },
  { id: 'apv-submissions', name: 'APV Submissions', icon: DocumentTextIcon },
];

interface AdminTabsProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm mb-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap space-x-2 sm:space-x-8 px-4 sm:px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}