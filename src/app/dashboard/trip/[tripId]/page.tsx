'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Sidebar from '@/components/Sidebar';
import ExpenseTable from '@/components/ExpenseTable';

interface Participant {
  id: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  arbitraryName?: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  paidBy: {
    id: string;
    username: string;
  };
  shares: Array<{
    id: string;
    participantId: string;
    percentage: number;
    calculatedShare: number;
    participant: Participant;
  }>;
}

interface Trip {
  id: string;
  name: string;
  description?: string;
  participants: Participant[];
  expenses: Expense[];
}

export default function TripPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { data: session } = useSession();
  const t = useTranslations();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [showNewTripModal, setShowNewTripModal] = useState(false);

  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [expenseShares, setExpenseShares] = useState<
    Record<string, number>
  >({});

  const [participantEmail, setParticipantEmail] = useState('');
  const [participantUsername, setParticipantUsername] = useState('');
  const [arbitraryName, setArbitraryName] = useState('');
  const [addMode, setAddMode] = useState<'email' | 'username' | 'arbitrary'>(
    'email'
  );

  useEffect(() => {
    fetchTrip();
    fetchAllTrips();
  }, [tripId]);

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}`);
      if (response.ok) {
        const data = await response.json();
        setTrip(data.trip);
        
        const defaultShares: Record<string, number> = {};
        const equalShare = 100 / data.trip.participants.length;
        data.trip.participants.forEach((p: Participant) => {
          defaultShares[p.id] = equalShare;
        });
        setExpenseShares(defaultShares);
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTrips = async () => {
    try {
      const response = await fetch('/api/trips');
      if (response.ok) {
        const data = await response.json();
        setAllTrips(data.trips);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    const shares = Object.entries(expenseShares).map(([participantId, percentage]) => ({
      participantId,
      percentage,
    }));

    const totalPercentage = shares.reduce((sum, s) => sum + s.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      alert('Total percentage must equal 100%');
      return;
    }

    try {
      const response = await fetch(`/api/trips/${tripId}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: expenseDescription,
          amount: parseFloat(expenseAmount),
          date: expenseDate,
          shares,
        }),
      });

      if (response.ok) {
        setShowNewExpenseModal(false);
        setExpenseDescription('');
        setExpenseAmount('');
        setExpenseDate(new Date().toISOString().split('T')[0]);
        fetchTrip();
      }
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const body: Record<string, string> = {};
      if (addMode === 'email') {
        body.email = participantEmail;
      } else if (addMode === 'username') {
        body.username = participantUsername;
      } else {
        body.arbitraryName = arbitraryName;
      }

      const response = await fetch(`/api/trips/${tripId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowAddParticipantModal(false);
        setParticipantEmail('');
        setParticipantUsername('');
        setArbitraryName('');
        fetchTrip();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add participant');
      }
    } catch (error) {
      console.error('Error adding participant:', error);
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

  if (!trip) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Trip not found</div>
      </div>
    );
  }

  return (
    <>
      <Sidebar trips={allTrips} onNewTrip={() => setShowNewTripModal(true)} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {trip.name}
              </h2>
              {trip.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {trip.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddParticipantModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                + {t('trip.addParticipant')}
              </button>
              <button
                onClick={() => setShowNewExpenseModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                + {t('expense.newExpense')}
              </button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {trip.participants.map((p) => (
              <div
                key={p.id}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
              >
                {p.user?.username || p.arbitraryName}
                {p.user?.id === session?.user?.id && ' (You)'}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ExpenseTable
            tripId={tripId}
            expenses={trip.expenses}
            participants={trip.participants}
            currentUserId={session?.user?.id || ''}
            onUpdate={fetchTrip}
          />
        </div>
      </main>

      {showNewExpenseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl my-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('expense.newExpense')}
            </h3>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('expense.description')}
                </label>
                <input
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Dinner at restaurant"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('expense.amount')} (EUR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="50.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('expense.date')}
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('expense.splitBetween')}
                </label>
                <div className="space-y-2">
                  {trip.participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                        {p.user?.username || p.arbitraryName}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={expenseShares[p.id] || 0}
                        onChange={(e) =>
                          setExpenseShares({
                            ...expenseShares,
                            [p.id]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-24 px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Total:{' '}
                  {Object.values(expenseShares)
                    .reduce((sum, val) => sum + val, 0)
                    .toFixed(2)}
                  %
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewExpenseModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddParticipantModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('trip.addParticipant')}
            </h3>
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setAddMode('email')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  addMode === 'email'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('participant.addByEmail')}
              </button>
              <button
                onClick={() => setAddMode('username')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  addMode === 'username'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('participant.addByUsername')}
              </button>
              <button
                onClick={() => setAddMode('arbitrary')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  addMode === 'arbitrary'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('participant.addArbitrary')}
              </button>
            </div>
            <form onSubmit={handleAddParticipant} className="space-y-4">
              {addMode === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    value={participantEmail}
                    onChange={(e) => setParticipantEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="user@email.com"
                  />
                </div>
              )}
              {addMode === 'username' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('auth.username')}
                  </label>
                  <input
                    type="text"
                    value={participantUsername}
                    onChange={(e) => setParticipantUsername(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="username"
                  />
                </div>
              )}
              {addMode === 'arbitrary' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('participant.arbitraryName')}
                  </label>
                  <input
                    type="text"
                    value={arbitraryName}
                    onChange={(e) => setArbitraryName(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="John (not registered)"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddParticipantModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  {t('common.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

