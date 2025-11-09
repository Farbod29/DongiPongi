import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trips = await prisma.trip.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          {
            participants: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        expenses: {
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
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ trips });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Trip name is required' },
        { status: 400 }
      );
    }

    const trip = await prisma.trip.create({
      data: {
        name,
        description,
        ownerId: session.user.id,
        participants: {
          create: {
            userId: session.user.id,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

