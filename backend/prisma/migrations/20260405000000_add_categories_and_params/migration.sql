-- CreateTable
CREATE TABLE "dbo"."categories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name_encrypted" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dbo"."user_params" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device" VARCHAR(128),
    "key" VARCHAR(64) NOT NULL,
    "value_encrypted" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_params_pkey" PRIMARY KEY ("id")
);

-- AlterTable (add category_id to items)
ALTER TABLE "dbo"."items"
ADD COLUMN IF NOT EXISTS "category_id" UUID;

-- CreateIndex
CREATE INDEX "categories_user_id_idx" ON "dbo"."categories"("user_id");

-- CreateIndex
CREATE INDEX "user_params_user_id_idx" ON "dbo"."user_params"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_params_user_id_key_key" ON "dbo"."user_params"("user_id", "key");

-- CreateIndex
CREATE INDEX "items_category_id_idx" ON "dbo"."items"("category_id");

-- AddForeignKey
ALTER TABLE "dbo"."categories" ADD CONSTRAINT "categories_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "dbo"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dbo"."user_params" ADD CONSTRAINT "user_params_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "dbo"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dbo"."items" ADD CONSTRAINT "items_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "dbo"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
