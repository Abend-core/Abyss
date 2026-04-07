-- AlterTable
ALTER TABLE "dbo"."items" ADD COLUMN "amount" numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "date" date NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN "is_recurring" boolean NOT NULL DEFAULT false,
ADD COLUMN "recurrence" varchar(50);
