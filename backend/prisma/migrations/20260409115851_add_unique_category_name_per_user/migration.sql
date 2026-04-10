/*
  Warnings:

  - A unique constraint covering the columns `[user_id,name_encrypted]` on the table `categories` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "categories_user_id_name_encrypted_key" ON "dbo"."categories"("user_id", "name_encrypted");
