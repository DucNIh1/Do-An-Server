-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('draft', 'pending', 'verified');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "status" "PostStatus" NOT NULL DEFAULT 'draft';
