import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId } = await params;
    const { description, amount, date, shares } = await request.json();

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        participants: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const isParticipant = trip.participants.some(
      (p) => p.userId === session.user.id
    );
    if (!isParticipant && trip.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    const expense = await prisma.expense.create({
      data: {
        tripId,
        description,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        paidById: session.user.id,
        shares: {
          create: shares.map(
            (share: { participantId: string; percentage: number }) => ({
              participantId: share.participantId,
              percentage: share.percentage,
              calculatedShare: (parseFloat(amount) * share.percentage) / 100,
            })
          ),
        },
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

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

