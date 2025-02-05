import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";
import { prisma } from "../db/client";
import { jest } from "@jest/globals";

jest.mock("../db/client", () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock("axios");

beforeEach(() => {
  mockReset(prismaMock);
});

type PrismaMock = DeepMockProxy<PrismaClient> & {
  $queryRaw: jest.Mock;
  exchangePrice: {
    findMany: jest.Mock;
    createMany: jest.Mock;
  };
  consolidatedPrice: {
    create: jest.Mock;
  };
};

export const prismaMock = prisma as unknown as PrismaMock;
