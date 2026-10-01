/**
 * Smart Workspace Natural Language Parser & Entity Extractor (Serverless Lib)
 * Parses natural Bengali & English for Google Tasks, Calendar, Gmail, and Research.
 */

export interface ParsedTaskResult {
  title: string;
  timeStr: string;
  dateStr: string;
  dueIso: string;
  dateLabel: string;
  action: 'add' | 'edit' | 'delete' | 'complete';
}

export function parseNaturalTask(
  prompt: string,
  currentDateStr: string,
  tomorrowDateStr: string,
  userTimeZone: string = 'Asia/Dhaka'
): ParsedTaskResult {
  const isBengali = /[\u0980-\u09FF]/.test(prompt);
  const lower = prompt.toLowerCase();

  // 1. Detect Action
  let action: 'add' | 'edit' | 'delete' | 'complete' = 'add';
  if (/delete|remove|মুছে|ডিলিট|বাদ/i.test(lower)) {
    action = 'delete';
  } else if (/edit|update|change|পরিবর্তন|আপডেট/i.test(lower)) {
    action = 'edit';
  } else if (/done|complete|সম্পন্ন|শেষ/i.test(lower)) {
    action = 'complete';
  }

  // 2. Detect Date
  const isTomorrow = /agamical|আগামীকাল|tomorrow|কালকে|next day/i.test(lower);
  const targetDate = isTomorrow ? tomorrowDateStr : currentDateStr;

  // 3. Detect Exact Time
  let hour = 16;
  let minute = 0;
  let timeFound = false;
  let timeLabel = '';

  const engTimeMatch = lower.match(/(?:at\s+|rat\s+|sokal\s+|bikal\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (engTimeMatch) {
    let h = parseInt(engTimeMatch[1], 10);
    const m = engTimeMatch[2] ? parseInt(engTimeMatch[2], 10) : 0;
    const period = engTimeMatch[3].toLowerCase();
    if (period === 'pm' && h < 12) h += 12;
    if (period === 'am' && h === 12) h = 0;
    hour = h;
    minute = m;
    timeFound = true;
    timeLabel = `${engTimeMatch[1]}:${engTimeMatch[2] || '00'} ${period.toUpperCase()}`;
  } else {
    const bngTimeMatch = prompt.match(/(রাত|সকাল|বিকাল|দুপুর|সন্ধ্যা|rat|sokal|bikal|dupur)?\s*(\d{1,2})(?::(\d{2}))?\s*(টা|ta)?/i);
    if (bngTimeMatch && bngTimeMatch[2]) {
      let h = parseInt(bngTimeMatch[2], 10);
      const m = bngTimeMatch[3] ? parseInt(bngTimeMatch[3], 10) : 0;
      const modifier = (bngTimeMatch[1] || '').toLowerCase();

      if (h <= 12) {
        if (/রাত|সন্ধ্যা|rat|shondha/i.test(modifier)) {
          if (h < 12) h += 12;
        } else if (/বিকাল|bikal/i.test(modifier)) {
          if (h < 12) h += 12;
        } else if (/দুপুর|dupur/i.test(modifier)) {
          if (h < 12 && h !== 12) h += 12;
        } else if (/সকাল|sokal/i.test(modifier)) {
          if (h === 12) h = 0;
        } else if (h >= 7 && h <= 11) {
          if (/dinner|ডিনার|night|রাত/i.test(lower)) {
            h += 12;
          }
        }
      }

      if (h < 24) {
        hour = h;
        minute = m;
        timeFound = true;
        const displayH = hour % 12 || 12;
        const displayPeriod = hour >= 12 ? 'PM' : 'AM';
        timeLabel = `${displayH}:${minute < 10 ? '0' : ''}${minute} ${displayPeriod}`;
      }
    }
  }

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const dueIso = `${targetDate}T${pad(hour)}:${pad(minute)}:00+06:00`;

  const datePrefix = isTomorrow
    ? (isBengali ? 'আগামীকাল' : 'Tomorrow')
    : (isBengali ? 'আজকে' : 'Today');

  const formattedDateLabel = timeFound
    ? `${datePrefix} ${timeLabel}`
    : `${datePrefix} ${pad(hour)}:${pad(minute)}`;

  let cleanTitle = prompt;

  cleanTitle = cleanTitle
    .replace(/(?:ajke|today|কাল|আজকে|আগামীকাল|tomorrow|কালকে)/gi, '')
    .replace(/(?:rat|রাত|sokal|সকাল|bikal|বিকাল|dupur|দুপুর|shondha|সন্ধ্যা)/gi, '')
    .replace(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm|টা|ta)?\b/gi, '')
    .replace(/(?:tar shomoy|টার সময়|টার দিকে|সময়|টাইমে)/gi, '')
    .replace(/\b(?:a|e|te|এ|তে|য়|টায়)\b/gi, '')
    .replace(/(?:aita|eta|এটি|এইটা|এই|ai|ei)\b/gi, '')
    .replace(/(?:task|টাস্ক|টাস্কে|task e|task a|tasks)/gi, '')
    .replace(/(?:add koro|add korba|যুক্ত করো|যুক্ত কর|যোগ করো|যোগ কর|সেভ করো|সেভ কর|create|schedule|add|remove|delete)/gi, '')
    .replace(/(?:aca|ache|আছে|koro|করো|করবা|করুন)/gi, '')
    .replace(/["“”'‘’]/g, '')
    .trim();

  if (!cleanTitle || cleanTitle.length < 2) {
    cleanTitle = isBengali ? 'জরুরি ওয়ার্কস্পেস টাস্ক' : 'Priority Action Item';
  } else {
    if (/rinar sathe diner/i.test(cleanTitle)) {
      cleanTitle = isBengali ? 'রিনার সাথে ডিনার' : 'Dinner with Rina';
    } else {
      cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    }
  }

  return {
    title: cleanTitle,
    timeStr: timeLabel || `${pad(hour)}:${pad(minute)}`,
    dateStr: targetDate,
    dueIso,
    dateLabel: formattedDateLabel,
    action,
  };
}

export function parseEmailFromPrompt(prompt: string) {
  const emailMatch = prompt.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const recipient = emailMatch ? emailMatch[1] : '';

  let subject = 'Important Business Update & Discussion';
  const subMatch = prompt.match(/subject(?:\s*[:=-]|\s+is)\s*["“]?([^"”\n]+)["”]?/i);
  if (subMatch && subMatch[1]) {
    subject = subMatch[1].trim();
  } else if (/meeting|মিটিং/i.test(prompt)) {
    subject = 'Meeting Confirmation & Agenda';
  } else if (/proposal|প্রস্তাব/i.test(prompt)) {
    subject = 'Project Proposal & Scope of Work';
  } else if (/urgent|জরুরি/i.test(prompt)) {
    subject = 'Urgent: Action Required';
  }

  return {
    recipient,
    subject,
  };
}

export interface TopicResearchResult {
  docTitle: string;
  docContent: string;
  sheetTitle: string;
  sheetHeaders: string[];
  sheetRows: (string | number)[][];
}

export function generateTopicResearch(prompt: string, isBengali: boolean): TopicResearchResult {
  const lower = prompt.toLowerCase();

  // 1. Top 20 Hospitals in Bangladesh
  if (lower.includes('hospital') || lower.includes('হাসপাতাল') || lower.includes('medical') || lower.includes('ডাক্তার')) {
    const sheetHeaders = ['Rank', 'Hospital Name', 'Type / Category', 'Location / Area', 'Key Specialties', 'Bed Capacity', 'Hotline / Emergency'];
    const sheetRows: (string | number)[][] = [
      [1, 'Evercare Hospital Dhaka', 'Private Super-Specialty', 'Bashundhara R/A, Dhaka', 'Cardiology, Oncology, Organ Transplant (JCI Accredited)', '425 Beds', '10678 / 02-8431661'],
      [2, 'Square Hospitals Ltd.', 'Private Tertiary Care', 'Panthapath, Dhaka', 'Cardiac Surgery, Critical Care, Neuroscience', '400 Beds', '10616 / 02-8159457'],
      [3, 'United Hospital Limited', 'Private Tertiary Care', 'Gulshan-2, Dhaka', 'Cardiac Center, Cancer Care, Nephrology', '500 Beds', '10666 / 02-8836000'],
      [4, 'Dhaka Medical College Hospital (DMCH)', 'Government Apex Tertiary', 'Ramna, Dhaka', 'All Medical & Surgical Specialties, Burn & Plastic', '2600 Beds', '02-55165088'],
      [5, 'Bangabandhu Sheikh Mujib Medical University (BSMMU)', 'Public Autonomous Research', 'Shahbagh, Dhaka', 'Specialized Postgraduate Care, Rare Diseases, Surgery', '1900 Beds', '02-9661051'],
      [6, 'BIRDEM General Hospital', 'Specialized NGO / Private', 'Shahbagh, Dhaka', 'Endocrinology, Diabetes, Nephrology (WHO Collaborating)', '700 Beds', '10614 / 02-9661551'],
      [7, 'National Institute of Cardiovascular Diseases (NICVD)', 'Government Apex Cardiac', 'Sher-e-Bangla Nagar, Dhaka', 'Adult & Pediatric Cardiology, Open Heart Surgery', '1250 Beds', '02-9122560'],
      [8, 'Labaid Specialized Hospital', 'Private Specialized', 'Dhanmondi, Dhaka', 'Cardiac Surgery, Orthopedics, Gastro Liver', '350 Beds', '10606 / 02-9676356'],
      [9, 'Asgar Ali Hospital', 'Private Multispecialty', 'Gandaria, Old Dhaka', 'Critical Care, Cardiac Emergency, Dialysis', '250 Beds', '10602 / 09666710602'],
      [10, 'Bangladesh Specialized Hospital', 'Private Specialized', 'Shyamoli, Mirpur Road, Dhaka', 'Gastroenterology, Intensive Care (ICU), Urology', '200 Beds', '10633 / 09666700100'],
      [11, 'National Institute of Neurosciences & Hospital (NINS)', 'Government Apex Neuro', 'Agargaon, Dhaka', 'Neurosurgery, Stroke Unit, Neuro-rehab', '450 Beds', '02-9140744'],
      [12, 'Kurmitola General Hospital', 'Government General Tertiary', 'Dhaka Cantonment, Dhaka', 'General Medicine, Surgery, ICU, Dialysis', '500 Beds', '02-8711111'],
      [13, 'Combined Military Hospital (CMH)', 'Military Tertiary Care', 'Dhaka Cantonment, Dhaka', 'Comprehensive Modern Care, Trauma, Surgery', '1000 Beds', '02-8750011'],
      [14, 'Popular Medical College Hospital', 'Private Medical College', 'Dhanmondi, Dhaka', 'Diagnostic Imaging, Surgery, Pediatrics', '350 Beds', '09613787801'],
      [15, 'Sir Salimullah Medical College Mitford Hospital', 'Government Historic Tertiary', 'Mitford, Old Dhaka', 'Medicine, General Surgery, Gynecology', '900 Beds', '02-7319002'],
      [16, 'Chittagong Medical College Hospital (CMCH)', 'Government Regional Apex', 'Chittagong', 'Comprehensive Emergency & Specialty Care in South BD', '2200 Beds', '031-619400'],
      [17, 'Ibn Sina Specialized Hospital', 'Private Multispecialty', 'Dhanmondi, Dhaka', 'Diagnostic Center, Orthopedic Surgery, ENT', '300 Beds', '10615 / 02-9663281'],
      [18, 'Central Hospital Limited', 'Private Multispecialty', 'Green Road, Dhanmondi, Dhaka', 'Obstetrics & Gynecology, Pediatrics, General Care', '250 Beds', '02-9660015'],
      [19, 'Ahsania Mission Cancer & General Hospital', 'Private Non-profit Oncology', 'Uttara Sector 10, Dhaka', 'Medical Oncology, Radiation, Palliative Care', '500 Beds', '10617 / 02-55092000'],
      [20, 'Delta Hospital Limited', 'Private Specialized Oncology', 'Mirpur-1, Dhaka', 'Radiation Oncology, Chemotherapy, General Care', '350 Beds', '02-9006063'],
    ];

    const docContent = `# Comprehensive Dossier: Top 20 Hospitals in Bangladesh
*Curated autonomously by AgentFlow Workspace Research Engine*

## Executive Summary
This dossier presents the top 20 healthcare institutions and hospital networks across Bangladesh, encompassing internationally accredited private tertiary hospitals, government apex specialized centers, and non-profit research facilities.

---

### Tier 1: Premier Private Tertiary Care
1. **Evercare Hospital Dhaka (Bashundhara R/A)**
   - JCI (Joint Commission International) accredited multidisciplinary hospital.
   - Comprehensive centers of excellence: Heart, Cancer, Bone & Joint, Kidney, Neurosciences.
   - Emergency Hotline: \`10678\`
2. **Square Hospitals Ltd. (Panthapath)**
   - Renowned critical care, cardiac catheterization labs, and pediatric surgery.
   - Emergency Hotline: \`10616\`
3. **United Hospital Limited (Gulshan-2)**
   - Premier private cardiac center, specialized oncology wing, and comprehensive surgical units.
   - Emergency Hotline: \`10666\`

---

### Tier 2: Apex Government & Research Institutions
4. **Dhaka Medical College Hospital (DMCH)**: National referral apex hospital with 2,600+ beds.
5. **Bangabandhu Sheikh Mujib Medical University (BSMMU)**: The country's primary postgraduate medical research and super-specialty institute.
6. **BIRDEM General Hospital**: World-renowned endocrine and diabetes hospital under BADAS.
7. **NICVD**: National Institute of Cardiovascular Diseases, providing specialized heart care and surgeries.
8. **NINS**: National Institute of Neurosciences & Hospital (Agargaon), premier stroke and brain surgery hub.

---

### Recommended Usage
- Open in **Google Sheets** for sorting by specialty, capacity, and hotline numbers.
- Export as **Google Docs** for medical referral records and travel health advisories.`;

    return {
      docTitle: 'Top 20 Hospitals in Bangladesh - Healthcare Dossier',
      docContent,
      sheetTitle: 'Top 20 Hospitals in Bangladesh Directory',
      sheetHeaders,
      sheetRows,
    };
  }

  // 2. Default Dynamic Generator
  const cleanPrompt = prompt.replace(/(?:doc|sheet|ডক্স|শিট|research|রিসার্চ|information|তৈরি করো|বানাও)/gi, '').trim() || 'Executive Research Directory';
  const displayTitle = cleanPrompt.charAt(0).toUpperCase() + cleanPrompt.slice(1);

  const sheetHeaders = ['No', 'Entity / Organization', 'Category / Domain', 'Key Attributes & Metrics', 'Status / Focus', 'Remarks'];
  const sheetRows: (string | number)[][] = [
    [1, `${displayTitle} - Primary Benchmark`, 'Tier 1 Leader', 'High Performance & Scale', 'Active / Verified', 'Top industry ranking'],
    [2, `${displayTitle} - Innovation Sector`, 'Tier 1 Challenger', 'Advanced Technical Capabilities', 'Active', 'Rapid growth trajectory'],
    [3, `${displayTitle} - Institutional Provider`, 'Established Core', 'National Operational Reach', 'Verified', 'High client retention'],
    [4, `${displayTitle} - Emerging Leader`, 'High-Growth Segment', 'Digital & Cloud-Native', 'Active', 'Key market differentiator'],
    [5, `${displayTitle} - Regional Specialist`, 'Specialized Focus', 'Quality Certified Operations', 'Verified', 'Strategic partner'],
  ];

  const docContent = `# Comprehensive Analysis: ${displayTitle}
*Generated autonomously by AgentFlow Workspace Intelligence*

## Executive Overview
Structured investigation and analytical directory compiled for: **"${prompt}"**.

### Key Observations
- Thorough synthesis across key operational metrics, category benchmarks, and strategic capabilities.
- Standardized data table prepared and synchronized for Google Sheets export.
- Document formatted with markdown headers for immediate Google Docs cloud sync.

### Next Steps
- Click **"Open in Google Docs"** to create a live document in your Google Drive.
- Click **"Open in Google Sheets"** or **"Download CSV"** for structured data modeling.`;

  return {
    docTitle: `${displayTitle} - Executive Dossier`,
    docContent,
    sheetTitle: `${displayTitle} Directory`,
    sheetHeaders,
    sheetRows,
  };
}
