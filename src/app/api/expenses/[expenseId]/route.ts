import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { expenseId } = await params;
    const { description, amount, date, shares } = await request.json();

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        trip: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const isParticipant = expense.trip.participants.some(
      (p) => p.userId === session.user.id
    );
    if (!isParticipant && expense.trip.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (shares) {
      const totalPercentage = shares.reduce(
        (sum: number, share: { percentage: number }) => sum + share.percentage,
        0
      );

      if (Math.abs(totalPercentage - 100) > 0.01) {
        return NextResponse.json(
          { error: 'Shares must total 100%' },
          { status: 400 }
        );
      }

      await prisma.expenseShare.deleteMany({
        where: { expenseId },
      });
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(description && { description }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(shares && {
          shares: {
            create: shares.map(
              (share: { participantId: string; percentage: number }) => ({
                participantId: share.participantId,
                percentage: share.percentage,
                calculatedShare:
                  ((amount ? parseFloat(amount) : expense.amount) *
                    share.percentage) /
                  100,
              })
            ),
          },
        }),
      },
      include: {
        paidBy: {
          select: {
            id: true,
            username: true,
          },
        },
        shares: {
          include: {
            participant: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ expense: updatedExpense });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { expenseId } = await params;

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        trip: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    if (
      expense.paidById !== session.user.id &&
      expense.trip.ownerId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

