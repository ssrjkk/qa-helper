import { useId, createContext, useContext, useCallback } from 'react';
import type { ReactNode, KeyboardEvent } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
  accentColor?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

const TabsContext = createContext<string>('');

const accentColorMap: Record<string, { active: string; border: string }> = {
  indigo: { active: 'bg-indigo-500/20 text-indigo-300', border: 'border-indigo-500/30' },
  purple: { active: 'bg-purple-500/20 text-purple-300', border: 'border-purple-500/30' },
  blue: { active: 'bg-blue-500/20 text-blue-300', border: 'border-blue-500/30' },
  green: { active: 'bg-green-500/20 text-green-300', border: 'border-green-500/30' },
  amber: { active: 'bg-amber-500/20 text-amber-300', border: 'border-amber-500/30' },
  red: { active: 'bg-red-500/20 text-red-300', border: 'border-red-500/30' },
};

function getAccentClasses(color?: string) {
  if (!color) return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
  const map = accentColorMap[color];
  return map ? `${map.active} ${map.border}` : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  const groupId = useId();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const currentIndex = tabs.findIndex((t) => t.id === activeTab);
      let nextIndex = currentIndex;

      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      e.preventDefault();
      onChange(tabs[nextIndex].id);
    },
    [tabs, activeTab, onChange],
  );

  return (
    <TabsContext.Provider value={groupId}>
      <div
        role="tablist"
        onKeyDown={handleKeyDown}
        className={`flex items-center gap-1 p-1 bg-white/5 rounded-lg ${className}`}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const panelId = `${groupId}-panel-${tab.id}`;
          const tabIdAttr = `${groupId}-tab-${tab.id}`;

          return (
            <button
              key={tab.id}
              id={tabIdAttr}
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                isActive ? getAccentClasses(tab.accentColor) : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
              {tab.label}
              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.5 text-xs bg-white/10 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </TabsContext.Provider>
  );
}

interface TabPanelProps {
  tabId: string;
  activeTab: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ tabId, activeTab, children, className = '' }: TabPanelProps) {
  const groupId = useContext(TabsContext);
  const panelId = `${groupId}-panel-${tabId}`;
  const tabIdAttr = `${groupId}-tab-${tabId}`;

  if (activeTab !== tabId) return null;

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabIdAttr}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
}
