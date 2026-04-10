/*
  Warnings:

  - You are about to drop the column `amount` on the `operations` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `operations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "dbo"."operations" DROP COLUMN "amount",
DROP COLUMN "title";
