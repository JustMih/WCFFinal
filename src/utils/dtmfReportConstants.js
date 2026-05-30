/** DTMF menu labels (matches IVR DTMF Usage report) */
export const DTMF_DIGIT_LABELS = {
  "1": "Registration Info",
  "2": "Confirmation Info",
  "3": "Claims Info",
  "4": "Compulsion Details",
  "5": "Accident Details",
  "6": "Office in Dodoma",
  "7": "Agent / Support Queue",
  "8": "Record Voice Note",
  "9": "Voice Note Saved",
};

export function getDtmfActionLabel(digit) {
  if (digit == null || digit === "") return "—";
  return DTMF_DIGIT_LABELS[String(digit)] || "—";
}
