/*
  Warnings:

  - You are about to drop the column `content` on the `ConsultationRequest` table. All the data in the column will be lost.
  - Added the required column `email` to the `ConsultationRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `majorId` to the `ConsultationRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ConsultationRequest" DROP COLUMN "content",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "majorId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "ConsultationRequest" ADD CONSTRAINT "ConsultationRequest_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "Major"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
