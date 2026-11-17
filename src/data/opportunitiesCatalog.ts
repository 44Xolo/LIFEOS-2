import type { OpportunityCatalogItem } from '../types/lifeos';

export const OPPORTUNITIES_CATALOG: OpportunityCatalogItem[] = [
  {
    id: 'opp_allan_gray_fellowship',
    title: 'Allan Gray Orbis Foundation Fellowship',
    organization: 'Allan Gray Orbis Foundation',
    kind: 'scholarship',
    location: 'South Africa (National)',
    valueLabel: 'Full Tuition + Mentorship',
    deadline: '2027-04-30',
    eligibility: [
      'South African citizen',
      'Applying for or enrolled in 1st-year undergraduate study',
      'Strong entrepreneurial & leadership mindset',
    ],
    summary:
      'Comprehensive university funding paired with entrepreneurial leadership development, accommodation, and personal mentorship.',
    sourceUrl: 'https://www.allangrayorbis.org/',
  },
  {
    id: 'opp_nyda_grant',
    title: 'NYDA Youth Enterprise Grant Programme',
    organization: 'National Youth Development Agency',
    kind: 'grant',
    location: 'South Africa',
    valueLabel: 'R 1,000 – R 250,000',
    deadline: 'Rolling Monthly Intake',
    eligibility: [
      'South African youth aged 18–35',
      '100% youth-owned micro or small enterprise',
      'Completed NYDA Business Management Training',
    ],
    summary:
      'Non-repayable financial and non-financial support for early-stage youth entrepreneurs to acquire equipment, stock, or launch services.',
    sourceUrl: 'https://www.nyda.gov.za/',
  },
  {
    id: 'opp_alx_software_eng',
    title: 'Full-Stack Web & Mobile Engineering Track',
    organization: 'ALX Africa',
    kind: 'training',
    location: 'Hybrid / Remote Africa',
    valueLabel: 'Sponsored Scholarship Cohort',
    deadline: '2027-01-15',
    eligibility: [
      'Age 18–34 residing on the African continent',
      'Consistent 20+ hrs/week commitment',
      'Reliable internet access',
    ],
    summary:
      'Project-driven software engineering curriculum covering TypeScript, React, backend APIs, cloud architecture, and career readiness.',
    sourceUrl: 'https://www.alxafrica.com/',
  },
  {
    id: 'opp_mandela_rhodes',
    title: 'The Mandela Rhodes Postgraduate Scholarship',
    organization: 'Mandela Rhodes Foundation',
    kind: 'scholarship',
    location: 'South African Universities',
    valueLabel: 'Full Postgraduate Funding',
    deadline: '2027-04-21',
    eligibility: [
      'Citizen of any African country',
      'Aged 19–29 with strong undergraduate academic record',
      'Demonstrated community impact and leadership',
    ],
    summary:
      'Covers tuition, accommodation, meals, travel, and a year-long leadership transformation programme at leading South African universities.',
    sourceUrl: 'https://www.mandelarhodes.org/',
  },
  {
    id: 'opp_takealot_sme_supplier',
    title: 'SMME Marketplace Supplier Accelerator',
    organization: 'South African E-Commerce Ecosystem',
    kind: 'business',
    location: 'Cape Town & Johannesburg',
    valueLabel: 'Onboarding + Fulfilment Credits',
    deadline: '2026-12-20',
    eligibility: [
      'CIPC-registered South African SME',
      'Valid tax clearance & B-BBEE affidavit',
      'Ready-to-ship retail inventory',
    ],
    summary:
      'Fast-track marketplace onboarding, logistics mentorship, and digital storefront optimization for emerging local consumer brands.',
    sourceUrl: 'https://www.gov.za/services/business',
  },
  {
    id: 'opp_grad_dev_intern',
    title: 'Junior Cloud & Product Engineering Internship',
    organization: 'Cape FinTech Collective',
    kind: 'internship',
    location: 'Cape Town / Hybrid',
    valueLabel: 'R 14,500 / month stipend',
    deadline: '2026-12-10',
    eligibility: [
      'Final-year student or recent graduate in CS / IT / Web Dev',
      'Portfolio of TypeScript, React, or mobile apps',
      'Available for 12-month structured rotation',
    ],
    summary:
      'Hands-on product engineering placement working alongside senior payments architects, mobile engineers, and UI systems designers.',
    sourceUrl: 'https://www.offerzen.com/',
  },
  {
    id: 'opp_seda_digital_sme',
    title: 'SEDA Small Business Digital & Compliance Advisory',
    organization: 'Small Enterprise Development Agency',
    kind: 'business',
    location: 'All 9 SA Provinces',
    valueLabel: 'Subsidised Advisory + Tools',
    deadline: 'Open Year-Round',
    eligibility: [
      'Operating micro, small, or medium enterprise in SA',
      'Valid SA ID and business registration or informal trader permit',
    ],
    summary:
      'Access business plan structuring, CIPC/SARS compliance coaching, and digital bookkeeping readiness workshops.',
    sourceUrl: 'https://www.seda.org.za/',
  },
  {
    id: 'opp_junior_product_dev',
    title: 'Associate Full-Stack TypeScript Engineer',
    organization: 'Meridian Civic Tech',
    kind: 'job',
    location: 'Remote (SA / EMEA Timezone)',
    valueLabel: 'R 32,000 – R 42,000 / month',
    deadline: '2026-12-05',
    eligibility: [
      '1+ year building React, Node.js, or Firebase applications',
      'Strong grasp of clean UI engineering & REST APIs',
      'Clear written communication',
    ],
    summary:
      'Build accessible digital public-service and SME productivity platforms for fast-growing African enterprises.',
    sourceUrl: 'https://www.linkedin.com/jobs/',
  },
];
