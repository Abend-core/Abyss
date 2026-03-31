/*
  Warnings:

  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email_hash]` on the table `users` will be added. If there are existing duplicate
    values, this will fail.
  - Added the required column `email_encrypted` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email_hash` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "dbo"."users_email_key";

-- AlterTable
ALTER TABLE "dbo"."users" DROP COLUMN "email",
ADD COLUMN     "email_encrypted" TEXT NOT NULL,
ADD COLUMN     "email_hash" VARCHAR(64) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_hash_key" ON "dbo"."users"("email_hash");
