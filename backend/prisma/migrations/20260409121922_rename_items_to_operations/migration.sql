/*
  Warnings:

  - You are about to drop the column `color_encrypted` on the `categories` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "dbo"."items" DROP CONSTRAINT "items_category_id_fkey";

-- DropForeignKey
ALTER TABLE "dbo"."items" DROP CONSTRAINT "items_user_id_fkey";

-- Rename table from items to operations
ALTER TABLE "dbo"."items" RENAME TO "operations";

-- Rename indexes on the renamed table
ALTER INDEX "items_user_id_idx" RENAME TO "operations_user_id_idx";
ALTER INDEX "items_category_id_idx" RENAME TO "operations_category_id_idx";
ALTER INDEX "items_pkey" RENAME TO "operations_pkey";

-- Add the encrypted columns for title and amount
ALTER TABLE "dbo"."operations" ADD COLUMN "title_encrypted" TEXT;
ALTER TABLE "dbo"."operations" ADD COLUMN "amount_encrypted" TEXT;

-- Recreate foreign keys on the renamed table
ALTER TABLE "dbo"."operations" ADD CONSTRAINT "operations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "dbo"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dbo"."operations" ADD CONSTRAINT "operations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "dbo"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop unused encrypted category color column
ALTER TABLE "dbo"."categories" DROP COLUMN "color_encrypted";
