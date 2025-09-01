export const SUBJECTS = {
  forest: { label: "Literacy", color: "#3B7D44" },
  desert: { label: "Math", color: "#C96A2B" },
  ocean:  { label: "Science", color: "#3BA7B6" },
  night:  { label: "HASS", color: "#404A73" },
};

export const STANDARDS = {
  frameworkOptions: ["Generic","ACARA","NZC"],
  Generic: {
    forest: "Foundational phonics & fluency",
    desert: "Number sense & operations",
    ocean:  "Physical forces & inquiry",
    night:  "Human geography basics"
  },
  ACARA: {
    forest: "ACARA F–2: Phonics & Fluency",
    desert: "ACARA F–2: Number (add within 10)",
    ocean:  "ACARA F–2: Physical sciences",
    night:  "ACARA F–2: HASS — Places & spaces"
  },
  NZC: {
    forest: "NZC L1: Phonics/Decoding",
    desert: "NZC L1: Number (to 10)",
    ocean:  "NZC L1: Physical World",
    night:  "NZC L1: Place & Environment"
  },
};