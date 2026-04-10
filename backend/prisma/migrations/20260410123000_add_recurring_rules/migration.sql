-- CreateTable
CREATE TABLE "dbo"."recurrence_rules" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_id" UUID,
    "title_encrypted" TEXT NOT NULL,
    "amount_encrypted" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "recurrence" VARCHAR(50) NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'expense',
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "recurrence_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurrence_rules_user_id_idx" ON "dbo"."recurrence_rules"("user_id");

-- CreateIndex
CREATE INDEX "recurrence_rules_category_id_idx" ON "dbo"."recurrence_rules"("category_id");

-- AddForeignKey
ALTER TABLE "dbo"."recurrence_rules" ADD CONSTRAINT "recurrence_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "dbo"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dbo"."recurrence_rules" ADD CONSTRAINT "recurrence_rules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "dbo"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "dbo"."operations" ADD COLUMN "recurrence_rule_id" UUID;

-- CreateIndex
CREATE INDEX "operations_recurrence_rule_id_idx" ON "dbo"."operations"("recurrence_rule_id");

-- AddForeignKey
ALTER TABLE "dbo"."operations" ADD CONSTRAINT "operations_recurrence_rule_id_fkey" FOREIGN KEY ("recurrence_rule_id") REFERENCES "dbo"."recurrence_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
