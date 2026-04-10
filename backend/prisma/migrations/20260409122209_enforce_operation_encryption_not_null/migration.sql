/*
  Warnings:

  - Made the column `title_encrypted` on table `operations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `amount_encrypted` on table `operations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "dbo"."operations" ALTER COLUMN "title_encrypted" SET NOT NULL,
ALTER COLUMN "amount_encrypted" SET NOT NULL;
