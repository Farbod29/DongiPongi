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
    const { email, username, arbitraryName } = await request.json();

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

    let participant;

    if (arbitraryName) {
      participant = await prisma.tripParticipant.create({
        data: {
          tripId,
          arbitraryName,
        },
      });
    } else {
      let user;
      if (email) {
        user = await prisma.user.findUnique({ where: { email } });
      } else if (username) {
        user = await prisma.user.findUnique({ where: { username } });
      }

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const existingParticipant = trip.participants.find(
        (p) => p.userId === user.id
      );
      if (existingParticipant) {
        return NextResponse.json(
          { error: 'User already a participant' },
          { status: 400 }
        );
      }

      participant = await prisma.tripParticipant.create({
        data: {
          tripId,
          userId: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });
    }

    return NextResponse.json({ participant }, { status: 201 });
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

