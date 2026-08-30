import { FormData } from '../types';

export interface SamplePreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  data: Partial<FormData>;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'epb-cyber-tsgt',
    name: 'Cyber Operations (TSgt / 1D771Q)',
    badge: 'EPB Full',
    description: 'Enlisted Performance Brief for a Cyber Defense Section Chief managing network security.',
    data: {
      productType: 'EPB',
      rankGrade: 'TSgt / E-6',
      afsc: '1D771Q (Enterprise Operations / Cyber Defense)',
      charLimit: 350,
      workMode: 'full',
      name: 'TSgt Marcus Vance',
      dutyTitle: 'Section Chief, Cyber Defense Operations',
      unit: '38th Cyberspace Squadron',
      ratingPeriod: '1 Apr 2025 – 31 Mar 2026',
      priorEvaluations: `EPR 2024 (SSgt): Led 5-member team on base firewall upgrade. Resolved 420 tickets, awarded Wing NCO of Quarter Q3. Scope was limited to local enclave maintenance.
EPR 2023 (SSgt): Handled Tier-2 help desk requests. Certified Sec+ and CCNA. Assisted with COMSEC inventory.`,
      rawNotes: `1. Mission execution / cyber incidents:
- Led response to a major zero-day exploit targeting wing SIPRNet router firmware across 3 tenant wings.
- Isolated 14 compromised hosts in under 2 hours (normal response time is 6 hours), prevented exfiltration of mission planning data.
- Built automated log correlation script in Python that cut daily triage time by 40% for our 12-person crew.
- Coordinated with 616 OC for enterprise-wide patch deployment across 4.2k endpoints.

2. Leading people / Team development:
- Supervised 8 Airmen and 3 civilians. Mentored 4 subordinates to complete CCAF degrees and 2 earned CASP+ certification.
- Stepped up as Flight Chief for 45 days during vacancy, ran daily ops for 28 personnel without mission interruption.
- Overhauled section qualification training syllabus, reduced new member mission qualification time from 90 days down to 45 days.

3. Managing resources / Budget & Equipment:
- Managed $1.8M squadron crypto and deployable comm kit inventory; passed MAJCOM IG SAV with zero discrepancies.
- Discovered 26 redundant software licenses during contract review, reclaimed $84K back to squadron unfunded priorities.
- Spearheaded rapid tech refresh of 60 tactical mission workstations, executed $210K end-of-year fallout funds in 72 hours.

4. Improving the unit / Innovation & Continuous improvement:
- Designed a centralized simulated phishing and cyber hygiene training module for 3,500 base personnel, dropped click rate from 18% to 3.2%.
- Standardized unit incident ticket escalation SOP, eliminating a 3-week backlog and cutting mean time to resolve (MTTR) by 55%.`
    }
  },
  {
    id: 'epb-maint-ssgt',
    name: 'Aircraft Maintenance (SSgt / 2A373)',
    badge: 'EPB Individual',
    description: 'Tactical Aircraft Maintenance Craftsman (F-35 / F-16 Dedicated Crew Chief).',
    data: {
      productType: 'EPB',
      rankGrade: 'SSgt / E-5',
      afsc: '2A373 (Tactical Aircraft Maintenance)',
      charLimit: 350,
      workMode: 'individual',
      name: 'SSgt Tyler Rivera',
      dutyTitle: 'Dedicated Crew Chief, F-35A Lightning II',
      unit: '58th Aircraft Maintenance Squadron',
      ratingPeriod: '1 Jan 2025 – 31 Dec 2025',
      priorEvaluations: `EPR 2024 (SrA): Performed 120 pre-flight inspections on F-16 fleet. Maintained 98% QA pass rate.`,
      rawNotes: `Accomplishment notes:
- Handled emergency engine swap during dynamic combat exercise RED FLAG; replaced F-35 Pratt & Whitney F135 engine in 14 hours (AF standard 24 hours), aircraft made morning surge takeoff on time.
- QA evaluation results: achieved 100% pass rate across 18 Quality Assurance inspections with zero minor findings; selected as Squadron DCC of the Month twice.
- Solved recurring intermittent avionics datalink fault that grounded lead jet for 5 days; identified damaged wiring harness pin, authored local inspection bulletin shared with 3 wings.`
    }
  },
  {
    id: '1206-annual-award',
    name: 'AF 1206 Award Nomination (NCO of Year)',
    badge: 'AF 1206',
    description: 'AF Form 1206 4-category award package for NCO of the Year.',
    data: {
      productType: '1206',
      rankGrade: 'TSgt / E-6',
      afsc: '3F071 (Personnel / Force Support)',
      charLimit: 250,
      workMode: 'full',
      name: 'TSgt Jessica Reynolds',
      dutyTitle: 'NCOIC, Military Personnel Section Customer Support',
      unit: '11th Force Support Squadron',
      ratingPeriod: '1 Jan 2025 – 31 Dec 2025',
      priorEvaluations: `Last year won Squadron NCO of the Year, managed 1.2k customer visits.`,
      rawNotes: `Major Performance / Leadership & Job Performance:
- Overhauled base in-processing line for 850 incoming permanent party personnel, reduced check-in wait time from 4 days to 4 hours.
- Processed 340 reenlistment and extension contracts worth $4.1M in SRBs with 100% audit accuracy across 2 MAJCOM inspections.
- Directed DEERS deployment for remote site, issued 1,400 CACs with zero downtime during server migration.

Whole Airman Concept / Self-Improvement:
- Completed Master's Degree in Human Resource Management (3.95 GPA).
- Served as Base Top 3 Association Treasurer, managed $14K budget and coordinated 6 community volunteer events raising $5.2K for Airman Attic.
- Mentored 14 Airmen in First Term Airmen Course (FTAC) on career progression and AF benefits.`
    }
  },
  {
    id: 'opb-intel-capt',
    name: 'Officer Performance Brief (Capt / 14N)',
    badge: 'OPB',
    description: 'Officer Performance Brief for an Intelligence Operations Flight Commander.',
    data: {
      productType: 'OPB',
      rankGrade: 'Capt / O-3',
      afsc: '14N (Intelligence Operations)',
      charLimit: 350,
      workMode: 'full',
      name: 'Capt Aaron Chen',
      dutyTitle: 'Flight Commander, Intelligence Operations',
      unit: '480th Intelligence, Surveillance, and Reconnaissance Wing',
      ratingPeriod: '1 Jul 2025 – 30 Jun 2026',
      priorEvaluations: `OPR 2024 (1st Lt): Executed target development for CENTCOM theater, briefed 40 daily operational summaries to Wing Commander.`,
      rawNotes: `Duty Description info:
Directs 42 military and civilian analysts delivering real-time target intelligence for 3 Combined Joint Task Forces. Responsible for $45M in specialized intelligence exploitation hardware and tactical collection architecture.

Accomplishments:
- Led intelligence preparation of the operational environment for multi-national live exercise; fused 1,200 multi-source sensor reports into dynamic threat picture for 84 strike packages.
- Directed rapid collection shift during high-tension crisis, pinpointing hostile surface-to-air missile radar relocation within 15 minutes, neutralizing threat to coalition aircraft.
- Mentored 6 Lieutenants and 18 junior enlisted analysts, producing 2 Wing-level quarterly award winners and achieving 100% mission qualification pass rate.`
    }
  }
];
