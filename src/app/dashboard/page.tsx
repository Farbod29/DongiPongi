'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useTranslations } from 'next-intl';

interface Trip {
  id: string;
  name: string;
  description?: string;
  participants: Array<{
    id: string;
    user?: {
      id: string;
      username: string;
    };
    arbitraryName?: string;
  }>;
}

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [tripName, setTripName] = useState('');
  const [tripDescription, setTripDescription] = useState('');
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/trips');
      if (response.ok) {
        const data = await response.json();
        setTrips(data.trips);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tripName,
          description: tripDescription,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowNewTripModal(false);
        setTripName('');
        setTripDescription('');
        router.push(`/dashboard/trip/${data.trip.id}`);
      }
    } catch (error) {
      console.error('Error creating trip:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar trips={trips} onNewTrip={() => setShowNewTripModal(true)} />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to {t('common.appName')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {trips.length === 0
              ? 'Create your first trip to start tracking expenses'
              : 'Select a trip from the sidebar or create a new one'}
          </p>
          {trips.length === 0 && (
            <button
              onClick={() => setShowNewTripModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {t('trip.newTrip')}
            </button>
          )}
        </div>
      </main>

      {showNewTripModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('trip.newTrip')}
            </h3>
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('trip.tripName')}
                </label>
                <input
                  type="text"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Summer Trip 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('trip.description')}
                </label>
                <textarea
                  value={tripDescription}
                  onChange={(e) => setTripDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTripModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium shadow-sm"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

