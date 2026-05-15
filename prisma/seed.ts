import { PrismaClient, Prisma } from '../src/generated/prisma-client';
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Resetting database...");

  // Clear existing data in correct order to respect foreign keys
  await prisma.syndromeRule.deleteMany({});
  await prisma.consultationSymptom.deleteMany({});
  await prisma.consultation.deleteMany({});
  await prisma.symptomOption.deleteMany({});
  await prisma.symptomCategory.deleteMany({});
  await prisma.syndrome.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.contributor.deleteMany({});

  console.log("Seeding from PDF source only...");

  // 1. Complaint
  const insomniaComplaint = await prisma.complaint.create({
    data: { name: "Insomnia" },
  });

  // 2. Symptom Categories & Options from PDF
  const symptomsData = [
    {
      category: "Tidur & Mimpi",
      options: [
        "Sulit tidur ringan (tidak berat)",
        "Mudah terbangun",
        "Sulit tidur karena marah/emosi",
        "Insomnia berat",
        "Banyak mimpi kacau",
        "Susah mulai tidur",
      ],
    },
    {
      category: "Kondisi Tubuh / Fisik",
      options: [
        "Palpitasi ringan",
        "Palpitasi",
        "Sensasi panas telapak",
        "Kepala panas/sakit kepala temporal",
        "Kepala berat",
        "Sakit Pinggang",
        "Kelelahan",
      ],
    },
    {
      category: "Keringat & Cairan",
      options: [
        "Night sweating",
        "Mulut/tenggorokan kering malam",
        "Mulut kering malam",
        "Dahak banyak",
        "Mulut pahit",
      ],
    },
    {
      category: "Mata & Wajah",
      options: ["Bibir pucat", "Mata merah"],
    },
    {
      category: "Pencernaan & Eliminasi",
      options: ["Konstipasi", "Urin gelap"],
    },
    {
      category: "Emosi & Mental",
      options: ["Cemas ringan", "Mudah tersinggung", "Gelisah berat"],
    },
    {
      category: "Telinga",
      options: ["Tinnitus ringan"],
    },
    {
      category: "Pengamatan Lidah",
      options: [
        "Lidah pucat",
        "Lidah merah sedikit tanpa coating",
        "Lidah merah sisi merah",
        "Lidah merah coating kuning lengket",
        "Lidah merah tanpa coating",
        "Coating kuning",
      ],
    },
    {
      category: "Pengamatan Nadi",
      options: ["Nadi wiry rapid"],
    },
  ];

  const symptomOptionMap: Record<string, string> = {};

  for (const item of symptomsData) {
    const category = await prisma.symptomCategory.create({
      data: { name: item.category },
    });

    for (const optName of item.options) {
      const option = await prisma.symptomOption.create({
        data: {
          name: optName,
          categoryId: category.id,
        },
      });
      symptomOptionMap[optName] = option.id;
    }
  }

  // 3. Syndromes from PDF
  const syndromesData = [
    {
      name: "Heart Blood Defisiensi",
      therapyPrinciple: "Nourish Heart Blood, calm Shen.",
      acupoints: "HT7, PC6, BL15, SP6, ST36, Anmian",
      rules: [
        { symptom: "Sulit tidur ringan (tidak berat)", cf: 0.8 },
        { symptom: "Mudah terbangun", cf: 0.85 },
        { symptom: "Palpitasi ringan", cf: 0.5 },
        { symptom: "Bibir pucat", cf: 0.8 },
        { symptom: "Lidah pucat", cf: 0.9 },
        { symptom: "Cemas ringan", cf: 0.55 },
      ],
    },
    {
      name: "Heart Yin Defisiensi",
      therapyPrinciple: "Nourish Yin, clear Empty Heat, calm Shen.",
      acupoints: "HT6, HT7, KI3, KI6, SP6, Anmian",
      rules: [
        { symptom: "Night sweating", cf: 0.95 },
        { symptom: "Sensasi panas telapak", cf: 0.85 },
        { symptom: "Mulut/tenggorokan kering malam", cf: 0.8 },
        { symptom: "Palpitasi", cf: 0.65 },
        { symptom: "Lidah merah sedikit tanpa coating", cf: 0.95 },
        { symptom: "Tinnitus ringan", cf: 0.9 },
      ],
    },
    {
      name: "Liver Fire",
      therapyPrinciple: "Drain Liver Fire, calm Shen.",
      acupoints: "LV2, GB20, LI11, HT7, Taiyang",
      rules: [
        { symptom: "Sulit tidur karena marah/emosi", cf: 0.95 },
        { symptom: "Mudah tersinggung", cf: 0.95 },
        { symptom: "Kepala panas/sakit kepala temporal", cf: 0.9 },
        { symptom: "Mata merah", cf: 0.85 },
        { symptom: "Mulut pahit", cf: 0.9 },
        { symptom: "Konstipasi", cf: 0.75 },
        { symptom: "Urin gelap", cf: 0.7 },
        { symptom: "Lidah merah sisi merah", cf: 0.95 },
        { symptom: "Coating kuning", cf: 0.8 },
        { symptom: "Nadi wiry rapid", cf: 0.95 },
      ],
    },
    {
      name: "Phlegm menyumbat Heart",
      therapyPrinciple: "Clear Heat, transform Phlegm, open orifices, calm Shen.",
      acupoints: "ST40, PC5, PC6, CV12, LI11, HT7",
      rules: [
        { symptom: "Insomnia berat", cf: 0.9 },
        { symptom: "Gelisah berat", cf: 0.85 },
        { symptom: "Banyak mimpi kacau", cf: 0.85 },
        { symptom: "Kepala berat", cf: 0.75 },
        { symptom: "Dahak banyak", cf: 0.9 },
        { symptom: "Lidah merah coating kuning lengket", cf: 0.95 },
      ],
    },
    {
      name: "Heart & Kidney tidak nyambung",
      therapyPrinciple: "Nourish Kidney Yin, clear Heart Fire, harmonize Heart-Kidney.",
      acupoints: "HT7, KI3, KI6, PC6, CV4, Anmian",
      rules: [
        { symptom: "Susah mulai tidur", cf: 0.85 },
        { symptom: "Night sweating", cf: 0.7 },
        { symptom: "Sakit Pinggang", cf: 0.95 },
        { symptom: "Kelelahan", cf: 0.75 },
        { symptom: "Mulut kering malam", cf: 0.85 },
        { symptom: "Lidah merah tanpa coating", cf: 0.95 },
      ],
    },
  ];

  for (const s of syndromesData) {
    const syndrome = await prisma.syndrome.create({
      data: {
        name: s.name,
        therapyPrinciple: s.therapyPrinciple,
        acupoints: s.acupoints,
        complaints: {
          create: {
            complaintId: insomniaComplaint.id
          }
        },
      } satisfies Prisma.SyndromeCreateInput,
    });

    for (const rule of s.rules) {
      const optionId = symptomOptionMap[rule.symptom];
      if (optionId) {
        await prisma.syndromeRule.create({
          data: {
            syndromeId: syndrome.id,
            symptomOptionId: optionId,
            cfWeight: rule.cf,
          },
        });
      }
    }
  }

  console.log("Reset and Seed from PDF completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
