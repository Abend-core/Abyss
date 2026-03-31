-- CreateTable
CREATE TABLE "dbo"."users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "auth_salt" VARCHAR(32) NOT NULL,
    "key_salt" VARCHAR(32) NOT NULL,
    "key_fragment" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dbo"."items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "dbo"."users"("email");

-- CreateIndex
CREATE INDEX "items_user_id_idx" ON "dbo"."items"("user_id");

-- AddForeignKey
ALTER TABLE "dbo"."items" ADD CONSTRAINT "items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "dbo"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
