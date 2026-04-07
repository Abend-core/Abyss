-- AlterTable
ALTER TABLE "dbo"."categories" ADD COLUMN     "color_encrypted" TEXT,
ADD COLUMN     "parent_id" UUID,
ADD COLUMN     "position" INTEGER;

-- AlterTable
ALTER TABLE "dbo"."items" ALTER COLUMN "amount" DROP DEFAULT,
ALTER COLUMN "date" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "dbo"."categories"("parent_id");

-- AddForeignKey
ALTER TABLE "dbo"."categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "dbo"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
