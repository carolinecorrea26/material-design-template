import type { ReferenceRateTable } from '../domain/ratePresentation';
/** Supplied source values retained verbatim, including the duplicated salary band. */
export const cseaDiTable: ReferenceRateTable = {
  version: 1, kind: 'html-table', title: 'CSEA Disability Income — Office / Clerical rates',
  columns: ['Annual salary', 'Monthly benefit', 'Age <30', 'Age 30–39', 'Age 40–49', 'Age 50–59', 'Age 60–64**'],
  rows: [
    ['$22,000–$25,999','$1,000','$15.49','$19.34','$24.56','$34.23','$39.41'],
    ['$26,000–$27,499','$1,200','$18.53','$23.15','$29.42','$40.99','$47.21'],
    ['$27,500–$29,999','$1,300','$20.06','$25.06','$31.85','$44.38','$51.11'],
    ['$30,000–$32,499','$1,400','$21.58','$26.96','$34.28','$47.76','$55.01'],
    ['$35,000–$37,499','$1,600','$24.63','$30.78','$39.14','$54.53','$62.81'],
    ['$35,000–$37,499','$1,700','$26.15','$32.68','$41.57','$57.91','$66.71'],
    ['$37,500–$39,999','$1,800','$27.68','$34.59','$44.00','$61.30','$70.61'],
    ['$40,000–$42,499','$1,900','$29.20','$36.50','$46.43','$64.68','$74.51'],
    ['$42,500–$44,999','$2,000','$30.73','$38.41','$48.86','$68.07','$78.42'],
  ],
  notes: [
    'Rates current as of April 2025. All rates include $5,000 Basic AD&D Coverage.',
    'Office or clerical work: 0-day Accident / 7-day Sickness waiting period; benefits payable up to 12 months. Pregnancy has a 7-day waiting period.',
    "Rates are based on attained age on the first day of an insurance period and increase at a new age bracket. Notify Pearl Insurance of a job classification change immediately, within 90 days.",
    'The supplied table repeats the $35,000–$37,499 salary band for $1,600 and $1,700 benefits; retained as supplied pending clarification. The source does not explain the ** marker or the collection frequency of the DI rate columns. No premium is calculated from this reference table.',
    'Rates and benefits may change for an entire class. Refer to the policy brochure for eligibility, benefits, exclusions, limitations and termination provisions. Underwritten by New York Life, Policy Form GMR.',
  ],
  sources: [{ kind: 'pdf', url: '/client/csea/rates/DI-Clerical.pdf', label: 'Supplied DI PDF' }, { kind: 'image', url: '/client/csea/rates/DI-Clerical.png', label: 'Supplied DI image' }],
};
export const cseaAddTable: ReferenceRateTable = {
  version: 1, kind: 'html-table', title: 'CSEA Group Accidental Death and Dismemberment — Office / Clerical rates',
  columns: ['Principal sum', 'Bi-weekly rate'], rows: [['$10,000','$0.27'],['$30,000','$0.81'],['$50,000','$1.35'],['$100,000','$2.70']],
  notes: ['$5,000 Basic AD&D coverage is included with Disability coverage. Optional amounts are available at additional cost.', 'The supplied AD&D PDF also describes the loss/benefit schedule and exclusions. Loss must occur within 90 days; only the largest benefit is payable for losses from one accident. See the complete source document.'],
  sources: [{ kind: 'pdf', url: '/client/csea/rates/ADDBenefits.pdf', label: 'Supplied AD&D benefits PDF' }, { kind: 'image', url: '/client/csea/rates/ADD-Clerical.png', label: 'Supplied AD&D rate image' }],
};
