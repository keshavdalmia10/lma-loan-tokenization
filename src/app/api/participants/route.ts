import { NextRequest, NextResponse } from 'next/server';
import { getParticipants, addParticipant, getParticipantByWallet } from '@/lib/store/loans';
import type { Participant } from '@/lib/types/loan';

// GET /api/participants - Get all participants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (walletAddress) {
      const participant = await getParticipantByWallet(walletAddress);
      if (!participant) {
        return NextResponse.json(
          { error: 'Participant not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(participant);
    }

    const participants = await getParticipants();
    return NextResponse.json(participants);
  } catch (error) {
    console.error('[API] Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}

// POST /api/participants - Create a new participant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Participant;

    // Validate required fields
    if (!body.name || !body.type || !body.jurisdiction) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, jurisdiction' },
        { status: 400 }
      );
    }

    const id = await addParticipant(body);

    return NextResponse.json(
      { success: true, id },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Error creating participant:', error);
    return NextResponse.json(
      { error: 'Failed to create participant' },
      { status: 500 }
    );
  }
}
