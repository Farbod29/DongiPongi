'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Trip {
  id: string;
  name: string;
  participants: Array<{
    id: string;
    user?: {
      id: string;
      username: string;
    };
    arbitraryName?: string;
  }>;
}

interface SidebarProps {
  trips: Trip[];
  onNewTrip: () => void;
}

export default function Sidebar({ trips, onNewTrip }: SidebarProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg"
      >
        {isCollapsed ? '☰' : '✕'}
      </button>

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ${
          isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col pt-16 lg:pt-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={onNewTrip}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              + {t('trip.newTrip')}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              {t('trip.trips')}
            </h2>
            <div className="space-y-1">
              {trips.map((trip) => {
                const isActive = pathname.includes(trip.id);
                return (
                  <Link
                    key={trip.id}
                    href={`/dashboard/trip/${trip.id}`}
                    className={`block p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="font-medium truncate">{trip.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {trip.participants.length} {t('trip.participants')}
                    </div>
                  </Link>
                );
              })}
              {trips.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  No trips yet
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

