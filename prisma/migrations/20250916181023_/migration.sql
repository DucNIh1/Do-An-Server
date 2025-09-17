/*
  Warnings:

  - Added the required column `postId` to the `UserRating` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserRating" ADD COLUMN     "postId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "UserRating" ADD CONSTRAINT "UserRating_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
