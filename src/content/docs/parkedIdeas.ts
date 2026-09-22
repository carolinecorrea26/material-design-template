export type ParkedIdea = {
  title: string;
  notes: string[];
};

/** Early-stage ideas not yet scoped as projects — captured for future consideration. */
export const parkedIdeas: ParkedIdea[] = [
  {
    title: "Quote homepage variant",
    notes: ["Quote is the main action on the landing page."],
  },
  {
    title: "AI chatbot",
    notes: [
      "Allow users to ask product questions to a bot that only has access to that client's product information.",
    ],
  },
  {
    title: "Portals: admin, client, advisor",
    notes: [
      "Admin portal — add/edit/view site requirements, access demo sites, view/download submitted or pending applications, finish pending applications, and see portal status.",
      "Client portal — status of application, update beneficiary/payment/coverage.",
      "Advisor portal — ability to track and pick up applicant-initiated applications.",
    ],
  },
  {
    title: "Capacitor",
    notes: [
      "Capacitor lets a modern web app run inside native iOS/Android containers and can be added to an existing modern JS project; allows access to phone capabilities (basic info, biometrics, camera, etc).",
      "Could be used for the admin, client, and advisor portals above.",
    ],
  },
  {
    title: "Text status updates",
    notes: ["Can't include any marketing content unless the user has opted in."],
  },
  {
    title: "Input checkmarks",
    notes: ["Simple motivating green checkmarks upon inline field validation."],
  },
  {
    title: "Search bar",
    notes: ["Basic search of the site map (surfaced as helper chip drawer content)."],
  },
  {
    title: "Compare products",
    notes: ["Checkbox to add products for side-by-side comparison on the coverage page (requested by AMA)."],
  },
  {
    title: "Product recommendation",
    notes: ["Product recommendations on the quote/coverage page based on user input."],
  },
  {
    title: "Redesigned health page",
    notes: ["Only ask questions that apply, eliminating the need to answer yes/no for every question."],
  },
  {
    title: "Error pages",
    notes: ["Dedicated 404, 500, etc. error pages."],
  },
];
