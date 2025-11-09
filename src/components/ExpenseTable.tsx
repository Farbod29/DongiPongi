'use client';

import React, { useState, useEffect } from 'react';
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

  const getParticipantName = (participant: Participant) => {
    return participant.user?.username || participant.arbitraryName || 'Unknown';
  };

  const handlePercentageClick = (expenseId: string, participantId: string, currentPercentage: number) => {
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

    const totalPercentage = updatedShares.reduce((sum, s) => sum + s.percentage, 0);
    
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
            </tr>
            <tr>
              <th colSpan={4} className="border-b border-gray-200 dark:border-gray-700"></th>
              {participants.map((participant) => (
                <React.Fragment key={participant.id}>
                  <th
                    className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10"
                  >
                    %
                  </th>
                  <th
                    className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                  >
                    {t('expense.share')}
                  </th>
                </React.Fragment>
              ))}
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
                    <>
                      <td
                        key={`${participant.id}-pct`}
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
                      <td
                        key={`${participant.id}-share`}
                        className="px-2 py-3 text-center text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-800"
                      >
                        EUR {(share?.calculatedShare || 0).toFixed(2)}
                      </td>
                    </>
                  );
                })}
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
    </div>
  );
}

