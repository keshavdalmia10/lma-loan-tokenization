import { NextResponse } from "next/server";

import { validateTransferServer } from "@/lib/services/trade-validation-server";

type ValidateTradeRequest = {
  tokenAddress: string;
  seller: string;
  buyer: string;
  units: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ValidateTradeRequest>;

    const tokenAddress = body.tokenAddress;
    const seller = body.seller;
    const buyer = body.buyer;
    const units = body.units;

    if (!tokenAddress || !seller || !buyer || typeof units !== "number") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: tokenAddress, seller, buyer, units",
        },
        { status: 400 }
      );
    }

    const validation = await validateTransferServer({
      tokenAddress,
      seller,
      buyer,
      units,
    });

    return NextResponse.json({ success: true, validation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

