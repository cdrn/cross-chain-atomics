/*
  Warnings:

  - Added the required column `hashlock` to the `RFQOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RFQOrder" ADD COLUMN     "hashlock" VARCHAR(255) NOT NULL;
