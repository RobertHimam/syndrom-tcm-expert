/*
  Warnings:

  - You are about to drop the `_ComplaintToSyndrome` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ComplaintToSyndrome" DROP CONSTRAINT "_ComplaintToSyndrome_A_fkey";

-- DropForeignKey
ALTER TABLE "_ComplaintToSyndrome" DROP CONSTRAINT "_ComplaintToSyndrome_B_fkey";

-- DropTable
DROP TABLE "_ComplaintToSyndrome";

-- CreateTable
CREATE TABLE "syndrome_complaints" (
    "syndromeId" UUID NOT NULL,
    "complaintId" UUID NOT NULL,

    CONSTRAINT "syndrome_complaints_pkey" PRIMARY KEY ("syndromeId","complaintId")
);

-- AddForeignKey
ALTER TABLE "syndrome_complaints" ADD CONSTRAINT "syndrome_complaints_syndromeId_fkey" FOREIGN KEY ("syndromeId") REFERENCES "syndromes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syndrome_complaints" ADD CONSTRAINT "syndrome_complaints_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
