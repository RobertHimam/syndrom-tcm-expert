-- CreateTable
CREATE TABLE "complaints" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptom_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "symptom_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptom_options" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "symptom_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syndromes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "therapyPrinciple" TEXT NOT NULL,
    "acupoints" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "syndromes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributors" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syndrome_rules" (
    "id" UUID NOT NULL,
    "syndromeId" UUID NOT NULL,
    "symptomOptionId" UUID NOT NULL,
    "cfWeight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "syndrome_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" UUID NOT NULL,
    "patientName" TEXT,
    "patientAge" INTEGER NOT NULL,
    "patientGender" TEXT NOT NULL,
    "complaintId" UUID NOT NULL,
    "diagnosisResult" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_symptoms" (
    "consultationId" UUID NOT NULL,
    "symptomOptionId" UUID NOT NULL,

    CONSTRAINT "consultation_symptoms_pkey" PRIMARY KEY ("consultationId","symptomOptionId")
);

-- CreateTable
CREATE TABLE "_ComplaintToSyndrome" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ComplaintToSyndrome_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "complaints_name_key" ON "complaints"("name");

-- CreateIndex
CREATE UNIQUE INDEX "symptom_categories_name_key" ON "symptom_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "symptom_options_name_categoryId_key" ON "symptom_options"("name", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "syndromes_name_key" ON "syndromes"("name");

-- CreateIndex
CREATE INDEX "syndrome_rules_symptomOptionId_idx" ON "syndrome_rules"("symptomOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "syndrome_rules_syndromeId_symptomOptionId_key" ON "syndrome_rules"("syndromeId", "symptomOptionId");

-- CreateIndex
CREATE INDEX "consultations_complaintId_idx" ON "consultations"("complaintId");

-- CreateIndex
CREATE INDEX "consultations_createdAt_idx" ON "consultations"("createdAt");

-- CreateIndex
CREATE INDEX "_ComplaintToSyndrome_B_index" ON "_ComplaintToSyndrome"("B");

-- AddForeignKey
ALTER TABLE "symptom_options" ADD CONSTRAINT "symptom_options_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "symptom_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syndrome_rules" ADD CONSTRAINT "syndrome_rules_syndromeId_fkey" FOREIGN KEY ("syndromeId") REFERENCES "syndromes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syndrome_rules" ADD CONSTRAINT "syndrome_rules_symptomOptionId_fkey" FOREIGN KEY ("symptomOptionId") REFERENCES "symptom_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_symptoms" ADD CONSTRAINT "consultation_symptoms_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_symptoms" ADD CONSTRAINT "consultation_symptoms_symptomOptionId_fkey" FOREIGN KEY ("symptomOptionId") REFERENCES "symptom_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComplaintToSyndrome" ADD CONSTRAINT "_ComplaintToSyndrome_A_fkey" FOREIGN KEY ("A") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComplaintToSyndrome" ADD CONSTRAINT "_ComplaintToSyndrome_B_fkey" FOREIGN KEY ("B") REFERENCES "syndromes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
