import type { Association, SiteAssociation } from "./model";

const isitrustAssociationNames = [
  ["akron-bar-association", "Akron Bar Association"],
  ["alabama-state-bar", "Alabama State Bar"],
  ["american-mountain-guides-association", "American Mountain Guides Association"],
  ["american-osteopathic-association", "American Osteopathic Association"],
  ["american-society-of-acupuncturists", "American Society of Acupuncturists"],
  ["atlanta-bar-association", "Atlanta Bar Association"],
  ["bar-association-of-metropolitan-st-louis", "Bar Association of Metropolitan St. Louis"],
  ["dekalb-bar-association", "DeKalb Bar Association"],
  ["ga-trial-lawyers-association", "GA Trial Lawyers Association"],
  ["indianapolis-bar-association", "Indianapolis Bar Association"],
  ["kansas-bar-association", "Kansas Bar Association"],
  ["los-angeles-county-bar-association", "Los Angeles County Bar Association"],
  ["louisiana-dental-association", "Louisiana Dental Association"],
  ["ma-nurses-association", "MA Nurses Association"],
  ["ms-association-for-justice", "MS Association for Justice"],
  ["ms-dental-association", "MS Dental Association"],
  ["ms-society-of-cpas", "MS Society of CPAs"],
  ["maricopa-county-bar-association", "Maricopa County Bar Association"],
  ["missouri-society-of-cpas", "Missouri Society of CPAs"],
  ["national-press-club", "National Press Club"],
  ["new-haven-county-bar-association", "New Haven County Bar Association"],
  ["orange-county-bar-association-of-ca", "Orange County Bar Association of CA"],
  ["student-osteopathic-medical-association", "Student Osteopathic Medical Association"],
  ["us-equestrian-federation", "US Equestrian Federation"],
  ["usa-fencing", "USA Fencing"],
] as const;

export const associationEntities: Association[] = [
  {
    id: "american-medical-association",
    clientId: "ama",
    name: "American Medical Association",
    acronym: "AMA",
    logo: "/client/ama/logo.png",
    logoAlt: "AMA Logo",
  },
  {
    id: "american-society-of-civil-engineers",
    clientId: "asce",
    name: "American Society of Civil Engineers",
    acronym: "ASCE",
    logo: "/client/asce/logo.png",
    logoAlt: "American Society of Civil Engineers logo",
  },
  {
    id: "american-veterinary-medical-association",
    clientId: "avma",
    name: "American Veterinary Medical Association",
    acronym: "AVMA",
    logo: "/client/avma/logo.png",
    logoAlt: "AVMA Logo",
  },
  {
    id: "waepa",
    clientId: "waepa",
    name: "Worldwide Assurance for Employees of Public Agencies",
    acronym: "WAEPA",
    logo: "/client/waepa/logo.png",
    logoAlt: "WAEPA Logo",
  },
  ...isitrustAssociationNames.map(([id, name]): Association => ({
    id,
    clientId: "isitrust",
    name,
  })),
];

const isitrustRelationships: SiteAssociation[] = isitrustAssociationNames.map(
  ([associationId]) => ({
    id: `isitrust-default--${associationId}`,
    siteId: "isitrust-default",
    associationId,
    enabled: true,
  }),
);

export const siteAssociationEntities: SiteAssociation[] = [
  {
    id: "ama-default--american-medical-association",
    siteId: "ama-default",
    associationId: "american-medical-association",
    enabled: true,
  },
  {
    id: "asce-default--american-society-of-civil-engineers",
    siteId: "asce-default",
    associationId: "american-society-of-civil-engineers",
    enabled: true,
  },
  {
    id: "avma-default--american-veterinary-medical-association",
    siteId: "avma-default",
    associationId: "american-veterinary-medical-association",
    enabled: true,
  },
  ...isitrustRelationships,
  {
    id: "waepa-standard--waepa",
    siteId: "waepa-standard",
    associationId: "waepa",
    enabled: true,
  },
  {
    id: "waepa-gi--waepa",
    siteId: "waepa-gi",
    associationId: "waepa",
    enabled: true,
  },
];

export const isitrustAssociationCount = isitrustAssociationNames.length;
