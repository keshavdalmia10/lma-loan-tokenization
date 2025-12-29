import { GraphQLClient, gql } from 'graphql-request';

/**
 * NEL Protocol (Nammu21) GraphQL Client
 *
 * This client integrates with NEL Protocol's GraphQL API for:
 * - Registering credit instruments
 * - Querying instrument data
 * - Syncing tokenization status
 * - Managing document references
 */

// GraphQL client instance
const createClient = () => {
  const endpoint = process.env.NEL_GRAPHQL_ENDPOINT || 'https://api.nammu21.com/graphql';
  const apiKey = process.env.NEL_API_KEY;

  return new GraphQLClient(endpoint, {
    headers: {
      ...(apiKey && { 'x-api-key': apiKey }),
      'Content-Type': 'application/json',
    },
  });
};

// ============ Types ============

export interface NELCreditInstrument {
  id: string;
  nelId: string;
  borrowerName: string;
  facilityAmount: string;
  currency: string;
  interestRate: {
    type: 'fixed' | 'floating';
    spread?: number;
    referenceRate?: string;
    basisPoints: number;
  };
  maturityDate: string;
  facilityType: string;
  securityType: string;
  seniorityRank: string;
  documentHash?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  tokenization?: {
    tokenAddress: string;
    blockchain: string;
    chainId: number;
    status: string;
  };
}

export interface NELCreateInstrumentInput {
  borrowerName: string;
  facilityAmount: string;
  currency: string;
  interestType: 'fixed' | 'floating';
  interestRateBps: number;
  spread?: number;
  referenceRate?: string;
  maturityDate: string;
  facilityType: string;
  securityType: string;
  seniorityRank: string;
  documentHash?: string;
}

export interface NELTokenizationInput {
  tokenAddress: string;
  blockchain: string;
  chainId: number;
  tokenSymbol: string;
  totalUnits: number;
  unitValue: string;
  identityRegistry?: string;
  compliance?: string;
}

// ============ GraphQL Queries ============

const GET_CREDIT_INSTRUMENT = gql`
  query GetCreditInstrument($nelId: String!) {
    creditInstrument(nelId: $nelId) {
      id
      nelId
      borrowerName
      facilityAmount
      currency
      interestRate {
        type
        spread
        referenceRate
        basisPoints
      }
      maturityDate
      facilityType
      securityType
      seniorityRank
      documentHash
      status
      createdAt
      updatedAt
      tokenization {
        tokenAddress
        blockchain
        chainId
        status
      }
    }
  }
`;

const SEARCH_INSTRUMENTS = gql`
  query SearchInstruments($filter: InstrumentFilterInput, $limit: Int, $offset: Int) {
    creditInstruments(filter: $filter, limit: $limit, offset: $offset) {
      items {
        id
        nelId
        borrowerName
        facilityAmount
        currency
        status
        maturityDate
        tokenization {
          tokenAddress
          status
        }
      }
      totalCount
      hasMore
    }
  }
`;

const CREATE_CREDIT_INSTRUMENT = gql`
  mutation CreateCreditInstrument($input: CreateCreditInstrumentInput!) {
    createCreditInstrument(input: $input) {
      id
      nelId
      borrowerName
      facilityAmount
      status
      createdAt
    }
  }
`;

const REGISTER_TOKENIZATION = gql`
  mutation RegisterTokenization($nelId: String!, $input: TokenizationInput!) {
    registerTokenization(nelId: $nelId, input: $input) {
      nelId
      tokenization {
        tokenAddress
        blockchain
        chainId
        status
      }
    }
  }
`;

const UPDATE_INSTRUMENT_STATUS = gql`
  mutation UpdateInstrumentStatus($nelId: String!, $status: String!) {
    updateInstrumentStatus(nelId: $nelId, status: $status) {
      nelId
      status
      updatedAt
    }
  }
`;

// ============ Client Functions ============

/**
 * Get a credit instrument by NEL ID
 */
export async function getCreditInstrument(nelId: string): Promise<NELCreditInstrument | null> {
  try {
    const client = createClient();
    const data = await client.request<{ creditInstrument: NELCreditInstrument }>(
      GET_CREDIT_INSTRUMENT,
      { nelId }
    );
    return data.creditInstrument;
  } catch (error) {
    console.error('Failed to fetch credit instrument from NEL:', error);
    // Return null if NEL is not available (graceful degradation)
    return null;
  }
}

/**
 * Search for credit instruments with optional filtering
 */
export async function searchInstruments(
  filter?: {
    borrowerName?: string;
    status?: string;
    minFacilityAmount?: string;
    maxFacilityAmount?: string;
    hasTokenization?: boolean;
  },
  limit = 20,
  offset = 0
): Promise<{
  items: NELCreditInstrument[];
  totalCount: number;
  hasMore: boolean;
}> {
  try {
    const client = createClient();
    const data = await client.request<{
      creditInstruments: {
        items: NELCreditInstrument[];
        totalCount: number;
        hasMore: boolean;
      };
    }>(SEARCH_INSTRUMENTS, { filter, limit, offset });
    return data.creditInstruments;
  } catch (error) {
    console.error('Failed to search instruments from NEL:', error);
    return { items: [], totalCount: 0, hasMore: false };
  }
}

/**
 * Create a new credit instrument in NEL Protocol
 */
export async function createCreditInstrument(
  input: NELCreateInstrumentInput
): Promise<{ nelId: string; id: string } | null> {
  try {
    const client = createClient();
    const data = await client.request<{
      createCreditInstrument: {
        id: string;
        nelId: string;
        borrowerName: string;
        status: string;
      };
    }>(CREATE_CREDIT_INSTRUMENT, { input });
    return {
      nelId: data.createCreditInstrument.nelId,
      id: data.createCreditInstrument.id,
    };
  } catch (error) {
    console.error('Failed to create credit instrument in NEL:', error);
    return null;
  }
}

/**
 * Register tokenization for a credit instrument
 */
export async function registerTokenization(
  nelId: string,
  input: NELTokenizationInput
): Promise<boolean> {
  try {
    const client = createClient();
    await client.request(REGISTER_TOKENIZATION, { nelId, input });
    return true;
  } catch (error) {
    console.error('Failed to register tokenization in NEL:', error);
    return false;
  }
}

/**
 * Update instrument status in NEL
 */
export async function updateInstrumentStatus(
  nelId: string,
  status: string
): Promise<boolean> {
  try {
    const client = createClient();
    await client.request(UPDATE_INSTRUMENT_STATUS, { nelId, status });
    return true;
  } catch (error) {
    console.error('Failed to update instrument status in NEL:', error);
    return false;
  }
}

// ============ Sync Functions ============

/**
 * Sync local loan data with NEL Protocol
 * Creates instrument in NEL if it doesn't exist
 */
export async function syncLoanToNEL(loan: {
  nelId: string;
  borrowerName: string;
  facilityAmount: bigint;
  currency: string;
  interestType: 'fixed' | 'floating';
  interestRateBps: number;
  spread?: number;
  referenceRate?: string;
  maturityDate: Date;
  facilityType: string;
  securityType: string;
  seniorityRank: string;
  documentHash?: string;
}): Promise<string | null> {
  // Check if instrument already exists
  const existing = await getCreditInstrument(loan.nelId);
  if (existing) {
    return existing.nelId;
  }

  // Create new instrument
  const result = await createCreditInstrument({
    borrowerName: loan.borrowerName,
    facilityAmount: loan.facilityAmount.toString(),
    currency: loan.currency,
    interestType: loan.interestType,
    interestRateBps: loan.interestRateBps,
    spread: loan.spread,
    referenceRate: loan.referenceRate,
    maturityDate: loan.maturityDate.toISOString(),
    facilityType: loan.facilityType,
    securityType: loan.securityType,
    seniorityRank: loan.seniorityRank,
    documentHash: loan.documentHash,
  });

  return result?.nelId || null;
}

/**
 * Sync tokenization status to NEL
 */
export async function syncTokenizationToNEL(
  nelId: string,
  tokenization: {
    tokenAddress: string;
    blockchain: string;
    chainId: number;
    tokenSymbol: string;
    totalUnits: number;
    unitValue: bigint;
    identityRegistry?: string;
    compliance?: string;
  }
): Promise<boolean> {
  return registerTokenization(nelId, {
    tokenAddress: tokenization.tokenAddress,
    blockchain: tokenization.blockchain,
    chainId: tokenization.chainId,
    tokenSymbol: tokenization.tokenSymbol,
    totalUnits: tokenization.totalUnits,
    unitValue: tokenization.unitValue.toString(),
    identityRegistry: tokenization.identityRegistry,
    compliance: tokenization.compliance,
  });
}

// ============ Health Check ============

/**
 * Check if NEL Protocol API is available
 */
export async function checkNELHealth(): Promise<boolean> {
  try {
    const client = createClient();
    // Simple health check query
    await client.request(gql`
      query Health {
        __typename
      }
    `);
    return true;
  } catch {
    return false;
  }
}

export default {
  getCreditInstrument,
  searchInstruments,
  createCreditInstrument,
  registerTokenization,
  updateInstrumentStatus,
  syncLoanToNEL,
  syncTokenizationToNEL,
  checkNELHealth,
};
