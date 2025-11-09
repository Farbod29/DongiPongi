'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

interface Participant {
  id: string;
  user?: {
    id: string;
    username: string;
  };
  arbitraryName?: string;
}

interface ExpenseShare {
  id: string;
  participantId: string;
  percentage: number;
  calculatedShare: number;
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
  shares: (ExpenseShare & {
    participant: Participant;
  })[];
}

interface ExpenseTableProps {
  tripId: string;
  expenses: Expense[];
  participants: Participant[];
  currentUserId: string;
  onUpdate: () => void;
}

export default function ExpenseTable({
  tripId,
  expenses,
  participants,
  currentUserId,
  onUpdate,
}: ExpenseTableProps) {
  const t = useTranslations();
  const [editingCell, setEditingCell] = useState<{
    expenseId: string;
    participantId: string;
  } | null>(null);
  const [tempPercentage, setTempPercentage] = useState<string>('');

  // Edit expense modal state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editShares, setEditShares] = useState<Record<string, number>>({});

  // Delete confirmation state
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(
    null
  );

  const getParticipantName = (participant: Participant) => {
    return participant.user?.username || participant.arbitraryName || 'Unknown';
  };

  const handlePercentageClick = (
    expenseId: string,
    participantId: string,
    currentPercentage: number
  ) => {
    setEditingCell({ expenseId, participantId });
    setTempPercentage(currentPercentage.toString());
  };

  const handlePercentageChange = async (expenseId: string) => {
    if (!editingCell) return;

    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    const newPercentage = parseFloat(tempPercentage) || 0;

    const updatedShares = expense.shares.map((share) => {
      if (share.participantId === editingCell.participantId) {
        return {
          participantId: share.participantId,
          percentage: newPercentage,
        };
      }
      return {
        participantId: share.participantId,
        percentage: share.percentage,
      };
    });

    const totalPercentage = updatedShares.reduce(
      (sum, s) => sum + s.percentage,
      0
    );

    if (Math.abs(totalPercentage - 100) > 0.01) {
      alert('Total percentage must equal 100%');
      setEditingCell(null);
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shares: updatedShares,
        }),
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating expense:', error);
    }

    setEditingCell(null);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setEditDescription(expense.description);
    setEditAmount(expense.amount.toString());
    setEditDate(expense.date.split('T')[0]);

    const shares: Record<string, number> = {};
    expense.shares.forEach((share) => {
      shares[share.participantId] = share.percentage;
    });
    setEditShares(shares);
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    const shares = Object.entries(editShares).map(
      ([participantId, percentage]) => ({
        participantId,
        percentage,
      })
    );

    const totalPercentage = shares.reduce((sum, s) => sum + s.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      alert('Total percentage must equal 100%');
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: editDescription,
          amount: parseFloat(editAmount),
          date: editDate,
          shares,
        }),
      });

      if (response.ok) {
        setEditingExpense(null);
        onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update expense');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Failed to update expense');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeletingExpenseId(null);
        onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  const calculateTotals = () => {
    const totals: Record<string, { paid: number; owes: number }> = {};

    participants.forEach((p) => {
      totals[p.id] = { paid: 0, owes: 0 };
    });

    expenses.forEach((expense) => {
      const paidByParticipant = participants.find(
        (p) => p.user?.id === expense.paidBy.id
      );
      if (paidByParticipant) {
        totals[paidByParticipant.id].paid += expense.amount;
      }

      expense.shares.forEach((share) => {
        totals[share.participantId].owes += share.calculatedShare;
      });
    });

    return totals;
  };

  const totals = calculateTotals();
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 min-w-[120px]">
                {t('expense.date')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 min-w-[200px]">
                {t('expense.description')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 min-w-[100px]">
                {t('expense.amount')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 min-w-[120px]">
                {t('expense.paidBy')}
              </th>
              {participants.map((participant) => (
                <th
                  key={participant.id}
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 min-w-[100px]"
                  colSpan={2}
                >
                  {getParticipantName(participant)}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 min-w-[100px]">
                Actions
              </th>
            </tr>
            <tr>
              <th
                colSpan={4}
                className="border-b border-gray-200 dark:border-gray-700"
              ></th>
              {participants.map((participant) => (
                <React.Fragment key={participant.id}>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10">
                    %
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                    {t('expense.share')}
                  </th>
                </React.Fragment>
              ))}
              <th className="border-b border-gray-200 dark:border-gray-700"></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                  {new Date(expense.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">
                  {expense.description}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">
                  EUR {expense.amount.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                  {expense.paidBy.username}
                </td>
                {participants.map((participant) => {
                  const share = expense.shares.find(
                    (s) => s.participantId === participant.id
                  );
                  const isEditing =
                    editingCell?.expenseId === expense.id &&
                    editingCell?.participantId === participant.id;

                  return (
                    <React.Fragment key={participant.id}>
                      <td
                        className="px-2 py-3 text-center text-sm border-b border-gray-100 dark:border-gray-800 bg-blue-50 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/20"
                        onClick={() =>
                          handlePercentageClick(
                            expense.id,
                            participant.id,
                            share?.percentage || 0
                          )
                        }
                      >
                        {isEditing ? (
                          <input
                            type="number"
                            value={tempPercentage}
                            onChange={(e) => setTempPercentage(e.target.value)}
                            onBlur={() => handlePercentageChange(expense.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handlePercentageChange(expense.id);
                              } else if (e.key === 'Escape') {
                                setEditingCell(null);
                              }
                            }}
                            autoFocus
                            className="w-full px-2 py-1 text-center bg-white dark:bg-gray-700 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-900 dark:text-white">
                            {share?.percentage || 0}%
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
                        EUR {(share?.calculatedShare || 0).toFixed(2)}
                      </td>
                    </React.Fragment>
                  );
                })}
                <td className="px-2 py-3 text-center border-b border-gray-100 dark:border-gray-800">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => handleEditExpense(expense)}
                      className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                      title={t('common.edit')}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeletingExpenseId(expense.id)}
                      className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                      title={t('common.delete')}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {t('trip.totalCost')}
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              EUR {totalExpenses.toFixed(2)}
            </div>
          </div>

          {participants.map((participant) => {
            const total = totals[participant.id];
            const balance = total.paid - total.owes;
            const isCurrentUser = participant.user?.id === currentUserId;

            return (
              <div
                key={participant.id}
                className={`p-4 rounded-lg ${
                  balance > 0
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : balance < 0
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : 'bg-gray-50 dark:bg-gray-700'
                } ${isCurrentUser ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {getParticipantName(participant)}
                  {isCurrentUser && ' (You)'}
                </div>
                <div
                  className={`text-xl font-bold ${
                    balance > 0
                      ? 'text-green-600 dark:text-green-400'
                      : balance < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {balance > 0 ? '+' : ''}EUR {balance.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {balance > 0
                    ? t('trip.youAreOwed')
                    : balance < 0
                    ? t('trip.youOwe')
                    : t('trip.settled')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl my-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('common.edit')} {t('expense.newExpense')}
            </h3>
            <form onSubmit={handleUpdateExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('expense.description')}
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('expense.date')}
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
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
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                        {getParticipantName(p)}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={editShares[p.id] || 0}
                        onChange={(e) =>
                          setEditShares({
                            ...editShares,
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
                  {Object.values(editShares)
                    .reduce((sum, val) => sum + val, 0)
                    .toFixed(2)}
                  %
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
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

      {/* Delete Confirmation Modal */}
      {deletingExpenseId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('common.delete')} Expense?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingExpenseId(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDeleteExpense(deletingExpenseId)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
