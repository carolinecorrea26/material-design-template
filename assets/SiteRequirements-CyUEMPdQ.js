import{a as f,w as y,j as e,Y as v,S as s,k as m,T as o,F as C,C as i,d as a,e as n,E as u,G as t,A as d,B as g}from"./index-BNC8s1MN.js";function S(){const c=f({defaultValues:{clientName:"",clientAcronym:"",themeColor:"blue",showPartnerLogo:!0,showRatingBadges:!0,enableDisabilityInsurance:!0,enableLifeInsurance:!0,showCoverageDetails:!0,showMembershipPage:!1,coverageLI:!0,coverageDI:!0,coverageOO:!1,coverageSH:!1,productsFile:"products",phone:"",phoneDisplay:"",heroTitle:"",heroSubtitle:"",membershipPrimaryQuestion:"",membershipSpouseQuestion:"",membershipType:"radio"}}),{watch:p}=c,h=p("showMembershipPage"),b=r=>{const l=[];r.coverageLI&&l.push("'LI'"),r.coverageDI&&l.push("'DI'"),r.coverageOO&&l.push("'OO'"),r.coverageSH&&l.push("'SH'");const j=`
  ${r.clientAcronym.toLowerCase()}: {
    id: '${r.clientAcronym.toLowerCase()}',
    branding: {
      name: '${r.clientName}',
      acronym: '${r.clientAcronym}',
      logo: '/brand/${r.clientAcronym.toLowerCase()}/logo.png',
      logoAlt: '${r.clientAcronym} Logo',
      partnerLogo: '/brand/nyl/logo.png',
      partnerLogoAlt: 'New York Life Logo',
      heroImage: '/brand/${r.clientAcronym.toLowerCase()}/hero.png',
      heroImageAlt: '${r.clientName}',
      heroTitle: '${r.heroTitle}',
      heroSubtitle: '${r.heroSubtitle}',
      products: [],
      phone: '${r.phone}',
      phoneDisplay: '${r.phoneDisplay}',
    },
    theme: {
      colorName: '${r.themeColor}',
    },
    fieldLabels: {
      dateOfBirth: 'Birthday',
      gender: 'Gender',
      state: 'State',
      nicotineUse: 'Do you use tobacco products?',
    },
    ${h?`membershipQuestion: {
      primaryQuestion: '${r.membershipPrimaryQuestion}',
      spouseQuestion: '${r.membershipSpouseQuestion}',
      type: '${r.membershipType}',
    },`:""}
    features: {
      showPartnerLogo: ${r.showPartnerLogo},
      showRatingBadges: ${r.showRatingBadges},
      enableDisabilityInsurance: ${r.enableDisabilityInsurance},
      enableLifeInsurance: ${r.enableLifeInsurance},
      showCoverageDetails: ${r.showCoverageDetails},
      showMembershipPage: ${r.showMembershipPage},
    },
    productsFile: '${r.productsFile}',
    coverageCategories: [${l.join(", ")}],
  },`;console.log("Generated Client Configuration:"),console.log(j),alert("Configuration generated! Check the console for the output.")},x=Object.keys(y).map(r=>({label:r.charAt(0).toUpperCase()+r.slice(1),value:r}));return e.jsx(v,{maxWidth:"lg",sx:{py:4},children:e.jsxs(s,{spacing:4,children:[e.jsxs(m,{children:[e.jsx(o,{variant:"h2",gutterBottom:!0,children:"Site Requirements & Configuration"}),e.jsx(o,{variant:"body1",color:"text.secondary",children:"Internal form to create a new client site configuration. Fill out all fields to generate the configuration code."})]}),e.jsx(C,{...c,children:e.jsx("form",{onSubmit:c.handleSubmit(b),children:e.jsxs(s,{spacing:4,children:[e.jsx(i,{children:e.jsxs(a,{children:[e.jsx(o,{variant:"h5",gutterBottom:!0,sx:{fontWeight:600},children:"Basic Information"}),e.jsxs(s,{spacing:3,sx:{mt:2},children:[e.jsx(n,{name:"clientName",label:"Client Name",placeholder:"e.g., National Association of REALTORS®",required:!0}),e.jsx(n,{name:"clientAcronym",label:"Client Acronym",placeholder:"e.g., NAR",required:!0}),e.jsx(u,{name:"themeColor",label:"Theme Color",options:x,required:!0})]})]})}),e.jsx(i,{children:e.jsxs(a,{children:[e.jsx(o,{variant:"h5",gutterBottom:!0,sx:{fontWeight:600},children:"Contact Information"}),e.jsxs(s,{spacing:3,sx:{mt:2},children:[e.jsx(n,{name:"phone",label:"Phone Number (digits only)",placeholder:"e.g., 8449270527",required:!0}),e.jsx(n,{name:"phoneDisplay",label:"Phone Display Format",placeholder:"e.g., (844) 927-0527",required:!0})]})]})}),e.jsx(i,{children:e.jsxs(a,{children:[e.jsx(o,{variant:"h5",gutterBottom:!0,sx:{fontWeight:600},children:"Branding & Content"}),e.jsxs(s,{spacing:3,sx:{mt:2},children:[e.jsx(n,{name:"heroTitle",label:"Hero Title",placeholder:"e.g., Insurance coverage designed for REALTORS®",required:!0,multiline:!0,rows:2}),e.jsx(n,{name:"heroSubtitle",label:"Hero Subtitle",placeholder:"e.g., Group Life and Disability Insurance available exclusively...",required:!0,multiline:!0,rows:3})]})]})}),e.jsx(i,{children:e.jsxs(a,{children:[e.jsx(o,{variant:"h5",gutterBottom:!0,sx:{fontWeight:600},children:"Features"}),e.jsxs(s,{spacing:2,sx:{mt:2},children:[e.jsx(t,{name:"showPartnerLogo",label:"Show Partner (NYL) Logo"}),e.jsx(t,{name:"showRatingBadges",label:"Show Rating Badges"}),e.jsx(t,{name:"enableDisabilityInsurance",label:"Enable Disability Insurance"}),e.jsx(t,{name:"enableLifeInsurance",label:"Enable Life Insurance"}),e.jsx(t,{name:"showCoverageDetails",label:"Show Coverage Details Dropdown"}),e.jsx(t,{name:"showMembershipPage",label:"Show Membership Page"})]})]})}),h&&e.jsx(i,{children:e.jsxs(a,{children:[e.jsx(o,{variant:"h5",gutterBottom:!0,sx:{fontWeight:600},children:"Membership Questions"}),e.jsxs(s,{spacing:3,sx:{mt:2},children:[e.jsx(n,{name:"membershipPrimaryQuestion",label:"Primary Member Question",placeholder:"e.g., Are you an active member of NAR?",required:!0}),e.jsx(n,{name:"membershipSpouseQuestion",label:"Spouse Member Question",placeholder:"e.g., Is your spouse an active member of NAR?",required:!0}),e.jsx(u,{name:"membershipType",label:"Question Type",options:[{label:"Radio Buttons (Yes/No)",value:"radio"},{label:"Checkbox",value:"checkbox"}],required:!0})]})]})}),e.jsx(i,{children:e.jsxs(a,{children:[e.jsx(o,{variant:"h5",gutterBottom:!0,sx:{fontWeight:600},children:"Coverage Categories"}),e.jsx(o,{variant:"body2",color:"text.secondary",sx:{mb:2},children:"Select which coverage categories are available for this client"}),e.jsxs(s,{spacing:2,children:[e.jsx(t,{name:"coverageLI",label:"Life Insurance (LI)"}),e.jsx(t,{name:"coverageDI",label:"Disability Insurance (DI)"}),e.jsx(t,{name:"coverageOO",label:"Office Overhead (OO)"}),e.jsx(t,{name:"coverageSH",label:"Supplemental Health (SH)"})]})]})}),e.jsx(i,{children:e.jsxs(a,{children:[e.jsx(o,{variant:"h5",gutterBottom:!0,sx:{fontWeight:600},children:"Products Configuration"}),e.jsxs(s,{spacing:3,sx:{mt:2},children:[e.jsx(u,{name:"productsFile",label:"Products File",options:[{label:"Standard Products",value:"products"},{label:"Demo Products",value:"products-demo"},{label:"NAR Products",value:"products-nar"},{label:"Custom (create new file)",value:"products-custom"}],required:!0}),e.jsx(d,{severity:"info",children:`If you select "Custom", you'll need to create a new products JSON file in the data/fixtures directory.`})]})]})}),e.jsxs(m,{sx:{display:"flex",justifyContent:"center",gap:2},children:[e.jsx(g,{type:"button",variant:"outlined",size:"large",onClick:()=>c.reset(),children:"Reset Form"}),e.jsx(g,{type:"submit",variant:"contained",size:"large",children:"Generate Configuration"})]}),e.jsxs(d,{severity:"warning",children:[e.jsx(o,{variant:"body2",sx:{fontWeight:600},gutterBottom:!0,children:"Next Steps After Generation:"}),e.jsxs(o,{variant:"body2",component:"div",children:["1. Copy the generated configuration from the console",e.jsx("br",{}),"2. Add it to src/config/clients.ts in the CLIENTS object",e.jsx("br",{}),"3. Create the required brand assets in public/brand/[acronym]/ directory",e.jsx("br",{}),"4. If using custom products, create the products JSON file",e.jsx("br",{}),"5. Update ACTIVE_CLIENT_ID in src/config/clients.ts to test",e.jsx("br",{}),"6. Add the new client to the DevTools dropdown"]})]})]})})})]})})}export{S as default};
