# Existing Association and Site identity crosswalk

This is a complete mapping of current reviewed export rows, not a merge or live database UUID inventory. Source-only definitions and unknown contexts remain unresolved. More than one lower association row does not prove a membership selector. AMA is the business-confirmed singleton example; other classifications are repository observations.

## Sites

| Site | Hosting Association candidate | Association context | Existing fixed key | Assigned rows | Page template |
| --- | --- | --- | --- | --- | --- |
| demo | demo | not-configured-do-not-infer | — | 0 | multi |
| abe | abe | not-configured-do-not-infer | — | 0 | multi |
| ama | ama | fixed-context-no-selector | american-medical-association | 1 | multi |
| asce | asce | fixed-context-no-selector | american-society-of-civil-engineers | 1 | multi |
| avma | avma | fixed-context-no-selector | american-veterinary-medical-association | 1 | multi |
| csea | csea | not-configured-do-not-infer | — | 0 | single |
| nso | nso | not-configured-do-not-infer | — | 0 | multi |
| isitrust | isitrust | multi-association-context | — | 25 | multi |
| waepa | waepa | fixed-context-no-selector | waepa | 1 | multi |
| waepa-gi | waepa | fixed-context-no-selector | waepa | 1 | single |

Page template single/multi describes the form layout and does not establish single/multi-association behavior. The current export contains one AMA Site; the confirmed model supports several, and no additional AMA Site is fabricated.

## Hosting Association candidates

| Existing clients key | Name | Reviewed TPA key | Sites | Classification | Ownership differs from local seed |
| --- | --- | --- | --- | --- | --- |
| demo | Demo Client | tpa-demo | demo | unresolved-site-association-context | no |
| abe | American Bar Endowment | mcr.tpa.abe | abe | unresolved-site-association-context | yes |
| ama | American Medical Association | mcr.tpa.amaia | ama | business-confirmed-single-association | yes |
| asce | American Society of Civil Engineers | tpa-asce | asce | observed-fixed-context-setup | no |
| avma | American Veterinary Medical Association | tpa-asce | avma | observed-fixed-context-setup | yes |
| csea | CSEA Group Sponsored Insurance Program | mcr.tpa.pca | csea | unresolved-site-association-context | yes |
| nso | Nurses Services Organization | mcr.tpa.asg | nso | unresolved-site-association-context | yes |
| isitrust | Insurance Specialists, Inc. | mcr.tpa.isi | isitrust | observed-multi-association-site-setup | yes |
| waepa | Worldwide Assurance for Employees of Public Agencies | mcr.tpa.waepa | waepa, waepa-gi | observed-fixed-context-setup | yes |
| mcr.client.aafp | AAFP American Academy of Family Physicians | mcr.tpa.aafpis | — | source-only-no-site-do-not-activate | no |
| mcr.client.aao | AAO American Association of Orthodontists | mcr.tpa.lockton | — | source-only-no-site-do-not-activate | no |
| mcr.client.aaosi | AAO American Association of Orthodontists | mcr.tpa.lockton | — | source-only-no-site-do-not-activate | no |
| mcr.client.aap | AAP American Academy of Pediatrics | mcr.tpa.usi | — | source-only-no-site-do-not-activate | no |
| mcr.client.achs | AChs American Chemical Society | tpa-asce | — | source-only-no-site-do-not-activate | no |
| mcr.client.achsgi | AChs American Chemical Society | tpa-asce | — | source-only-no-site-do-not-activate | no |
| mcr.client.achsncgi | AChs American Chemical Society | tpa-asce | — | source-only-no-site-do-not-activate | no |
| mcr.client.acs | ACS American College of Surgeons ACSQD - same info | mcr.tpa.amwins | — | source-only-no-site-do-not-activate | no |
| mcr.client.acsinitiategi | ACSInitiateGI | mcr.tpa.amwins | — | source-only-no-site-do-not-activate | no |
| mcr.client.acsposttraininggi | ACSPostTrainingGI  American College of Surgeons | mcr.tpa.amwins | — | source-only-no-site-do-not-activate | no |
| mcr.client.ascegi | ASCEGI American Society of Civil Engineers | tpa-asce | — | source-only-no-site-do-not-activate | no |
| mcr.client.ascencgi | ASCEGI American Society of Civil Engineers | tpa-asce | — | source-only-no-site-do-not-activate | no |
| mcr.client.caa | CAA Columbia Alumni Association | mcr.tpa.amwins | — | source-only-no-site-do-not-activate | no |
| mcr.client.caagi | CAA (GI) Columbia Alumni Association | mcr.tpa.amwins | — | source-only-no-site-do-not-activate | no |
| mcr.client.crbg | CRBG Compass Benefits Group  (Federal Employees) | mcr.tpa.crbg | — | source-only-no-site-do-not-activate | no |
| mcr.client.nada | NADA National Automobile Dealers Association | mcr.tpa.ftj | — | source-only-no-site-do-not-activate | no |
| mcr.client.nadaee | NADA GI National Automobile Dealers Association | mcr.tpa.ftj | — | source-only-no-site-do-not-activate | no |
| mcr.client.okba | OPIT Oklahoma Professional Insurance Trust | mcr.tpa.beale | — | source-only-no-site-do-not-activate | no |
| mcr.client.aiit | AIIT Appraisal Institute Insurance Trust (Formerly known as REAGIT Real Estate Appraisers Group Insurance Trust) | tpa-asce | — | source-only-no-site-do-not-activate | no |
| mcr.client.aiitgi | AIITGI | tpa-asce | — | source-only-no-site-do-not-activate | no |
| mcr.client.itp | SASS | mcr.tpa.hbi | — | source-only-no-site-do-not-activate | no |
| mcr.client.itpsi | SASS-SI | mcr.tpa.sass | — | source-only-no-site-do-not-activate | no |
| mcr.client.spe | SPE Society of Petroleum Engineers | mcr.tpa.agia | — | source-only-no-site-do-not-activate | no |
| mcr.client.txcpa | TXCPA Texas Society of Certified Public Accountants | mcr.tpa.ftj | — | source-only-no-site-do-not-activate | no |
| mcr.client.ibm | IBM Credit Union Group Trust (LifeRing) | mcr.tpa.amwins | — | source-only-no-site-do-not-activate | no |
| mcr.client.apwudigi | American Postal Workers Union | mcr.tpa.alliant | — | source-only-no-site-do-not-activate | no |
| mcr.client.geo | GeoCare Society of Economic Geologists | mcr.tpa.agia | — | source-only-no-site-do-not-activate | no |
| mcr.client.apsit | APSIT American Physical Society Insurance Trust | tpa-asce | — | source-only-no-site-do-not-activate | no |
| mcr.client.cseacap | CSEACAP | mcr.tpa.pca | — | source-only-no-site-do-not-activate | no |
| mcr.client.lsba | Gilsbar Louisiana State Bar | mcr.tpa.gilsbar | — | source-only-no-site-do-not-activate | no |
| mcr.client.tie | TIE Trust for Insuring Educators | mcr.tpa.ftj | — | source-only-no-site-do-not-activate | no |
| mcr.client.nysba | NYSBA/NYSBAGI | mcr.tpa.usi | — | source-only-no-site-do-not-activate | no |
| mcr.client.oma | Ontario Medical Association | mcr.tpa.manulife | — | source-only-no-site-do-not-activate | no |
| mcr.client.agit | Mercer  Alumni | mcr.tpa.marsh-ares-amba-on-portal | — | source-only-no-site-do-not-activate | no |
| mcr.client.agitsi | Mercer  Alumni - SI | mcr.tpa.marsh | — | source-only-no-site-do-not-activate | no |
| mcr.client.aia | AIA Trust American Institute of Architects Trust | mcr.tpa.hbi | — | source-only-no-site-do-not-activate | no |
| mcr.client.aiche | American Institute of Chemical Engineers | mcr.tpa.asg | — | source-only-no-site-do-not-activate | no |
| mcr.client.akc | Loyal Legacy Plan Administrator | mcr.tpa.loyal-legacy-plan-administrator | — | source-only-no-site-do-not-activate | no |
| mcr.client.cap | College of American Pathologists | mcr.tpa.asg | — | source-only-no-site-do-not-activate | no |
| mcr.client.cat | Collegiate alumni Trust | mcr.tpa.meyer | — | source-only-no-site-do-not-activate | no |
| mcr.client.catgi | Collegiate alumni Trust (GI) | mcr.tpa.meyer | — | source-only-no-site-do-not-activate | no |
| mcr.client.waepagi | Worldwide Assurance for Employees of Public Agencies | mcr.tpa.waepa | — | source-only-no-site-do-not-activate | no |
| mcr.client.waepaconfgi | Worldwide Assurance for Employees of Public Agencies | mcr.tpa.waepa | — | source-only-no-site-do-not-activate | no |
| mcr.client.waepaupgrade | Worldwide Assurance for Employees of Public Agencies | mcr.tpa.waepa | — | source-only-no-site-do-not-activate | no |
| mcr.client.waepachildgi | Worldwide Assurance for Employees of Public Agencies | mcr.tpa.waepa | — | source-only-no-site-do-not-activate | no |
| mcr.client.apta | American Physical Therapy Association | mcr.tpa.asg | — | source-only-no-site-do-not-activate | no |
| mcr.client.avmalifegi | AVMA LIFE Trust | tpa-asce | — | source-only-no-site-do-not-activate | no |
| mcr.client.avmalifetrustgrad | AVMA LIFE Trust | tpa-asce | — | source-only-no-site-do-not-activate | no |
| mcr.client.avmastudent | AVMA LIFE Trust | tpa-asce | — | source-only-no-site-do-not-activate | no |
| mcr.client.hpso | Healthcare Providers Service Organization | mcr.tpa.asg | — | source-only-no-site-do-not-activate | no |
| mcr.client.nspe | NSPE National Society of Professional Engineers | tpa-asce | — | source-only-no-site-do-not-activate | no |
| mcr.client.aoa | AOA American Optometric Association | mcr.tpa.agia-az | — | source-only-no-site-do-not-activate | no |
| mcr.client.ruaa | Rutgers University Alumni Associciation | mcr.tpa.selman | — | source-only-no-site-do-not-activate | no |
| mcr.client.calsea | CSEA California State Employees Association | mcr.tpa.agia | — | source-only-no-site-do-not-activate | no |
| mcr.client.calsearet | CSEA California State Employees Association | mcr.tpa.agia | — | source-only-no-site-do-not-activate | no |
| mcr.client.ieee | IEEE | mcr.tpa.amba | — | source-only-no-site-do-not-activate | no |
| mcr.client.acog | ACOG | tpa-asce | — | source-only-no-site-do-not-activate | no |
| mcr.client.calbar | Cal Bar | mcr.tpa.amba | — | source-only-no-site-do-not-activate | no |
| mcr.client.aana | American Association of Nurse Anesthesis | mcr.tpa.hbi | — | source-only-no-site-do-not-activate | no |
| mcr.client.crnastudent | AANA (CRNA Program) | mcr.tpa.hbi | — | source-only-no-site-do-not-activate | no |
| mcr.client.nycla | New York County Lawyers Association | mcr.tpa.asg | — | source-only-no-site-do-not-activate | no |
| mcr.client.aad | American Academy of Dermatology | mcr.tpa.asg | — | source-only-no-site-do-not-activate | no |
| mcr.client.acp | Amerrican College of Physians | mcr.tpa.agia | — | source-only-no-site-do-not-activate | no |
| mcr.client.asme | The American Society of Mechanical Engineers | mcr.tpa.marsh-now-amba | — | source-only-no-site-do-not-activate | no |
| mcr.client.asmegi | The American Society of Mechanical Engineers | mcr.tpa.amba | — | source-only-no-site-do-not-activate | no |
| mcr.client.nar | National Association of REALTORS® | mcr.tpa.instpa | — | source-only-no-site-do-not-activate | no |
| mcr.client.nargi | National Association of REALTORS® | mcr.tpa.instpa | — | source-only-no-site-do-not-activate | no |
| mcr.client.lifehelp | LifeHelp | mcr.tpa.lifehelp | — | source-only-no-site-do-not-activate | no |
| mcr.client.apwu | American Postal Workers Union | mcr.tpa.alliant | — | source-only-no-site-do-not-activate | no |
| mcr.client.apwuadd | American Postal Workers Union | mcr.tpa.alliant | — | source-only-no-site-do-not-activate | no |
| mcr.client.aptagradassist | American Physical Therapy Association | mcr.tpa.asg | — | source-only-no-site-do-not-activate | no |
| mcr.client.acep | American College of Emergency Physicians | mcr.tpa.hbi | — | source-only-no-site-do-not-activate | no |
| mcr.client.aaop | AAOp | mcr.tpa.marsh | — | source-only-no-site-do-not-activate | no |
| mcr.client.nysscpa | NYSSCPA | tpa-asce | — | source-only-no-site-do-not-activate | no |
| mcr.client.aptagi | American Physical Therapy Association (APTA) | mcr.tpa.asg | — | source-only-no-site-do-not-activate | no |
| mcr.client.asae | ASAE | mcr.tpa.aon | — | source-only-no-site-do-not-activate | no |
| mcr.client.atpe | ISI - ATPE | mcr.tpa.isi | — | source-only-no-site-do-not-activate | no |
| mcr.client.ncsfa | ISI - NCSFA | mcr.tpa.isi | — | source-only-no-site-do-not-activate | no |
| mcr.client.auic | Association of United Internet Consumers | mcr.tpa.instpa | — | source-only-no-site-do-not-activate | no |
| mcr.client.apharm | Apharm | mcr.tpa.aon | — | source-only-no-site-do-not-activate | no |
| mcr.client.roa | Reserve Organization of America | mcr.tpa.amba | — | source-only-no-site-do-not-activate | no |
| mcr.client.moaa | MOAA | mcr.tpa.amba | — | source-only-no-site-do-not-activate | no |
| mcr.client.npmhu | National Postal Mail Handlers Union | mcr.tpa.alliant | — | source-only-no-site-do-not-activate | no |
| mcr.client.baer | CSFEWBC | mcr.tpa.selman | — | source-only-no-site-do-not-activate | no |
| mcr.client.usba | USBA | mcr.tpa.usba | — | source-only-no-site-do-not-activate | no |
| mcr.client.amta | American Massage Therapy Association | mcr.tpa.agia | — | source-only-no-site-do-not-activate | no |

## Existing lower Association rows

| Existing associations key | Hosting candidate | Observed role | Proposed treatment |
| --- | --- | --- | --- |
| american-medical-association | ama | fixed-association-context-profile | candidate-alias-or-profile-of-hosting-association-preserve-source-id |
| american-society-of-civil-engineers | asce | fixed-association-context-profile | candidate-alias-or-profile-of-hosting-association-preserve-source-id |
| american-veterinary-medical-association | avma | fixed-association-context-profile | candidate-alias-or-profile-of-hosting-association-preserve-source-id |
| waepa | waepa | fixed-association-context-profile | candidate-alias-or-profile-of-hosting-association-preserve-source-id |
| akron-bar-association | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| alabama-state-bar | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| american-mountain-guides-association | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| american-osteopathic-association | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| american-society-of-acupuncturists | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| atlanta-bar-association | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| bar-association-of-metropolitan-st-louis | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| dekalb-bar-association | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| ga-trial-lawyers-association | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| indianapolis-bar-association | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| kansas-bar-association | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| los-angeles-county-bar-association | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| louisiana-dental-association | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| ma-nurses-association | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| ms-association-for-justice | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| ms-dental-association | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| ms-society-of-cpas | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| maricopa-county-bar-association | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| missouri-society-of-cpas | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| national-press-club | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| new-haven-county-bar-association | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| orange-county-bar-association-of-ca | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| student-osteopathic-medical-association | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| us-equestrian-federation | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| usa-fencing | isitrust | association-offered-on-multi-association-site | candidate-separate-association-with-explicit-membership-link |
| mcr.association.aafp.2 | mcr.client.aafp | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.aao.3 | mcr.client.aao | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.aaosi.4 | mcr.client.aaosi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.aap.5 | mcr.client.aap | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.aap.6 | mcr.client.aap | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.abe.7 | abe | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.abe.8 | abe | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.achs.9 | mcr.client.achs | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.achsgi.10 | mcr.client.achsgi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.achsncgi.11 | mcr.client.achsncgi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.acs.12 | mcr.client.acs | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.acsinitiategi.13 | mcr.client.acsinitiategi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.acsposttraininggi.14 | mcr.client.acsposttraininggi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.ama.15 | ama | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.asce.16 | asce | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.ascegi.17 | mcr.client.ascegi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.ascencgi.18 | mcr.client.ascencgi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.caa.19 | mcr.client.caa | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.caagi.20 | mcr.client.caagi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.crbg.21 | mcr.client.crbg | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.nada.22 | mcr.client.nada | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.nadaee.23 | mcr.client.nadaee | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.okba.24 | mcr.client.okba | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.aiit.25 | mcr.client.aiit | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.aiitgi.26 | mcr.client.aiitgi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.itp.27 | mcr.client.itp | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.itpsi.30 | mcr.client.itpsi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.spe.31 | mcr.client.spe | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.txcpa.32 | mcr.client.txcpa | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.ibm.33 | mcr.client.ibm | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.apwudigi.34 | mcr.client.apwudigi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.geo.35 | mcr.client.geo | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.apsit.46 | mcr.client.apsit | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.csea.60 | csea | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.cseacap.61 | mcr.client.cseacap | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.lsba.62 | mcr.client.lsba | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.tie.63 | mcr.client.tie | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.nysba.131 | mcr.client.nysba | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.oma.132 | mcr.client.oma | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.agit.133 | mcr.client.agit | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.agitsi.195 | mcr.client.agitsi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.aia.227 | mcr.client.aia | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.aiche.229 | mcr.client.aiche | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.akc.230 | mcr.client.akc | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.cap.231 | mcr.client.cap | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.cat.232 | mcr.client.cat | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.catgi.344 | mcr.client.catgi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.waepa.346 | waepa | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.waepagi.347 | mcr.client.waepagi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.waepaconfgi.348 | mcr.client.waepaconfgi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.waepaupgrade.349 | mcr.client.waepaupgrade | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.waepachildgi.350 | mcr.client.waepachildgi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.apta.351 | mcr.client.apta | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.avma.352 | avma | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.avmalifegi.353 | mcr.client.avmalifegi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.avmalifetrustgrad.354 | mcr.client.avmalifetrustgrad | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.avmastudent.355 | mcr.client.avmastudent | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.nso.356 | nso | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.hpso.357 | mcr.client.hpso | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.nspe.358 | mcr.client.nspe | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.aoa.359 | mcr.client.aoa | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.ruaa.360 | mcr.client.ruaa | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.ruaa.361 | mcr.client.ruaa | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.calsea.362 | mcr.client.calsea | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.calsearet.363 | mcr.client.calsearet | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.ieee.364 | mcr.client.ieee | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.acog.365 | mcr.client.acog | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.calbar.366 | mcr.client.calbar | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.aana.367 | mcr.client.aana | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.crnastudent.368 | mcr.client.crnastudent | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.nycla.369 | mcr.client.nycla | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.aad.370 | mcr.client.aad | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.acp.371 | mcr.client.acp | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.asme.372 | mcr.client.asme | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.asmegi.373 | mcr.client.asmegi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.nar.374 | mcr.client.nar | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.nargi.375 | mcr.client.nargi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.lifehelp.376 | mcr.client.lifehelp | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.apwu.377 | mcr.client.apwu | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.apwuadd.378 | mcr.client.apwuadd | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.aptagradassist.379 | mcr.client.aptagradassist | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.acep.381 | mcr.client.acep | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.aaop.382 | mcr.client.aaop | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.nysscpa.383 | mcr.client.nysscpa | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.aptagi.384 | mcr.client.aptagi | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.asae.385 | mcr.client.asae | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.isi.387 | isitrust | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.atpe.388 | mcr.client.atpe | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.ncsfa.389 | mcr.client.ncsfa | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.auic.390 | mcr.client.auic | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.apharm.391 | mcr.client.apharm | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.roa.392 | mcr.client.roa | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.moaa.393 | mcr.client.moaa | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.npmhu.394 | mcr.client.npmhu | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.baer.395 | mcr.client.baer | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.usba.396 | mcr.client.usba | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.usba.397 | mcr.client.usba | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |
| mcr.association.amta.398 | mcr.client.amta | unassigned-evidence-or-definition | preserve-unresolved-do-not-promote-to-membership-choice |

## Direct scalar ownership impact

| Table | Column | Proposed meaning |
| --- | --- | --- |
| analytics_measurements | client_id | Hosting Association context; preserve original ownership until crosswalk is resolved |
| applicants | client_id | Applicant tenant context: hosting versus actual Association ownership still requires an application-model decision |
| application_applicants | client_id | Applicant tenant context: hosting versus actual Association ownership still requires an application-model decision |
| associations | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |
| branding_profiles | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |
| client_environment_links | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |
| clients | organization_id | TPA ownership on the hosting Association |
| configuration_values | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |
| content_values | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |
| flag_assignments | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |
| migration_schedules | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |
| pattern_assignments | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |
| product_amount_rules | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |
| product_clients | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |
| product_identifiers | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |
| product_riders | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |
| rule_assignments | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |
| site_builder_drafts | client_id | Hosting Association context; preserve original ownership until crosswalk is resolved |
| site_field_configurations | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |
| site_flows | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |
| sites | client_id | Hosting Association context; preserve original ownership until crosswalk is resolved |
| support_profiles | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |
| url_usages | client_key | Hosting Association context; preserve original ownership until crosswalk is resolved |

The JSON crosswalk retains every source ID, source reference, site assignment and export ownership difference. No proposed treatment authorizes deleting a duplicate or changing historical records.
