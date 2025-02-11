import { PrismaClient } from "@prisma/client";
import { jest } from "@jest/globals";

// Create a mock PrismaClient with type assertions
const mockPrisma = {
  consolidatedPrice: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  volatilityMetric: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  exchangePrice: {
    findMany: jest.fn(),
    createMany: jest.fn(),
  },
  rFQRequest: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  rFQQuote: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  rFQOrder: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  solver: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
} as any as jest.Mocked<PrismaClient>;

// Mock the prisma module
jest.mock("../db/client", () => ({
  __esModule: true,
  prisma: mockPrisma,
}));

jest.mock("axios");

beforeEach(() => {
  jest.clearAllMocks();
});

export const prismaMock = mockPrisma;
