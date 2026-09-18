/*
  Warnings:

  - A unique constraint covering the columns `[no]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customer_no]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "no" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "customer_no" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "orders_no_key" ON "orders"("no");

-- CreateIndex
CREATE UNIQUE INDEX "users_customer_no_key" ON "users"("customer_no");
ALTER SEQUENCE "users_customer_no_seq" RESTART WITH 1001;