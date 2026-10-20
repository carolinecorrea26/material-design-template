
export const SECURITY_QUESTIONS: {
  id: string;
  question: string;
  options: string[];
}[] = [
  {
    id: "sq-1",
    question: "In what city were you living in 2005?",
    options: [
      "Albany",
      "Rochester",
      "Syracuse",
      "Buffalo",
      "None of the answers apply to me",
    ],
  },
  {
    id: "sq-2",
    question: "What kind of car did you own in 2007?",
    options: [
      "Honda Civic",
      "Toyota Camry",
      "Ford Focus",
      "Chevrolet Malibu",
      "None of the answers apply to me",
    ],
  },
  {
    id: "sq-3",
    question: "Which of the following have you been associated with?",
    options: [
      "Oak Street",
      "Maple Avenue",
      "Cedar Lane",
      "Elm Drive",
      "None of the answers apply to me",
    ],
  },
];
