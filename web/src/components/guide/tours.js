// Everything the guide says lives here, so the copy can be edited without touching the components.
// A tour step points at an element marked data-guide="<target>". Steps whose element isn't on
// the page right now (say, "New passport" for a wallet that can't use it) are skipped.

export const SEEN_KEY = "pela:guide-seen";
export const GOAL_KEY = "pela:guide-goal";

/** Slide 2 of the welcome: the four ideas you need before anything else makes sense. */
export const CONCEPTS = [
  {
    icon: "wallet",
    title: "Your wallet is your login",
    body: "No password. You connect a wallet like MetaMask and sign a short message to prove it's you. Signing is free.",
  },
  {
    icon: "chain",
    title: "Pets live on the blockchain",
    body: "Each passport and stamp is written to a public record. Once a vet stamps it, nobody can quietly change it.",
  },
  {
    icon: "lock",
    title: "Your details stay private",
    body: "Your name, email and bio are kept in Pela's own database, off the blockchain, so you can edit or delete them any time.",
  },
  {
    icon: "key",
    title: "Roles decide what you can do",
    body: "Owners issue passports, vets and trainers add stamps, and admins hand out the roles.",
  },
];

/** Slide 3: pick what brings you here and get a short path to follow. */
export const GOALS = [
  {
    id: "owner",
    icon: "paw",
    label: "I have a pet",
    blurb: "Give your pet a passport and choose who can stamp it.",
    steps: [
      { text: "Connect your wallet with the button at the top right.", done: "signedIn" },
      { text: "Ask an admin to give your wallet the Owner (Viewer) role.", done: "viewer" },
      { text: "Open your Pack and press \"New passport\"." },
      { text: "In the passport's Settings, add your vet's wallet address." },
    ],
  },
  {
    id: "vet",
    icon: "stethoscope",
    label: "I'm a vet or trainer",
    blurb: "Stamp visits into the passports you've been invited to.",
    steps: [
      { text: "Connect your wallet with the button at the top right.", done: "signedIn" },
      { text: "Ask an admin for the Editor role.", done: "editor" },
      { text: "Ask the owner to add your wallet address to their pet." },
      { text: "Open that pet's passport and press \"Stamp the passport\"." },
    ],
  },
  {
    id: "admin",
    icon: "shield",
    label: "I run Pela",
    blurb: "Hand out roles, pause the system and look after profiles.",
    steps: [
      { text: "Connect the admin wallet.", done: "signedIn" },
      { text: "Open the Admin page from the menu at the top.", done: "admin" },
      { text: "Paste a wallet address into the Role desk to grant a role." },
      { text: "If something looks wrong, \"Pause all writes\" stops every change." },
    ],
  },
  {
    id: "explore",
    icon: "compass",
    label: "Just looking around",
    blurb: "See how it works before you connect anything.",
    steps: [
      { text: "Scroll down to watch a passport collect its stamps." },
      { text: "Click the numbers under \"Three keys\" to compare the roles." },
      { text: "Connect a wallet whenever you're ready. Nothing costs money to look." },
    ],
  },
];

const HOME = [
  {
    target: "hero",
    title: "This is Pela",
    body: "A passport for your pet that lives on the blockchain. Vaccinations, checkups and training become ink stamps signed by the vet's wallet.",
  },
  {
    target: "connect",
    title: "Connect your wallet",
    body: "This is how you sign in. MetaMask asks you to sign a short message, which is free and doesn't move any money.",
  },
  {
    target: "account",
    title: "You're signed in",
    body: "This shows who you're signed in as. Click it to edit your name and colour; the door icon next to it signs you out.",
  },
  {
    target: "nav-pack",
    title: "Your pack",
    body: "Every passport you hold or are allowed to stamp is in here.",
  },
  {
    target: "contents",
    title: "Jump around",
    body: "Opens a list of every part of this page so you can skip straight to it.",
  },
  {
    target: "story",
    title: "How a record is born",
    body: "Scroll through this part to watch a passport get issued and stamped, step by step.",
  },
  {
    target: "roles",
    title: "Three kinds of people",
    body: "Click 01, 02 or 03 to see what owners, vets and admins can each do.",
  },
  {
    target: "ledger",
    title: "Live from the blockchain",
    body: "These numbers are read straight from the Pela contract every time the page loads.",
  },
  {
    target: "motion",
    title: "Too much movement?",
    body: "This button pauses every animation on the site. Your choice is remembered.",
  },
  {
    target: "guide",
    title: "Help is always here",
    body: "Open this guide again any time, from any page.",
  },
];

const GATE = {
  target: "gate",
  title: "Sign in to see this page",
  body: "This part of Pela needs your wallet. Press \"Connect & sign in\" and approve the message in MetaMask.",
};

const DASHBOARD = [
  GATE,
  {
    target: "pack-roles",
    title: "Your roles",
    body: "These badges show what your wallet is allowed to do. Hover one for details.",
  },
  {
    target: "new-passport",
    title: "Issue a passport",
    body: "Owners start here. Give your pet a name, breed and birthday, then confirm in your wallet.",
  },
  {
    target: "passports",
    title: "Your passports",
    body: "Each card is one pet. Click a card to open its stamp book.",
  },
  {
    target: "nav-profile",
    title: "Your profile",
    body: "Set the name vets and owners will see instead of your wallet address.",
  },
  { target: "guide", title: "Need this again?", body: "The guide is always one click away." },
];

const PET = [
  GATE,
  {
    target: "passport-card",
    title: "The ID page",
    body: "The pet's details as stored on the blockchain. The line of letters at the bottom is the passport's machine-readable code.",
  },
  {
    target: "pager",
    title: "Flip between passports",
    body: "Use the arrows, or your keyboard's ← and → keys, to turn to the next passport. The middle opens a list of all of them.",
  },
  {
    target: "stamp-tabs",
    title: "Stamps and settings",
    body: "The stamp book holds every visit. Owners also get a Settings tab to edit details, invite a vet or retire the passport.",
  },
  {
    target: "stamp-button",
    title: "Add a stamp",
    body: "Vets and trainers record a visit here. Each stamp is signed by their wallet and dated by the blockchain.",
  },
  {
    target: "stamp-book",
    title: "The stamp book",
    body: "Filter by care type, and turn pages when there are more than six stamps. Authors can fix or withdraw their own stamps.",
  },
  { target: "guide", title: "Need this again?", body: "The guide is always one click away." },
];

const PROFILE = [
  GATE,
  {
    target: "profile-form",
    title: "About you",
    body: "Your name, email and bio. They're kept off the blockchain, so you can change or delete them whenever you like.",
  },
  {
    target: "accent",
    title: "Pick a colour",
    body: "Changes the accent colour across the whole site, just for you.",
  },
  {
    target: "preview",
    title: "What others see",
    body: "A live preview of the card vets and owners see next to your stamps.",
  },
  { target: "guide", title: "Need this again?", body: "The guide is always one click away." },
];

const ADMIN = [
  GATE,
  {
    target: "system",
    title: "The big switch",
    body: "Shows whether Pela is live. Pausing stops every change on the blockchain until you unpause; reading still works.",
  },
  {
    target: "role-desk",
    title: "Hand out roles",
    body: "Paste a wallet address, pick a role and press Grant or Revoke. You'll see what the wallet already holds.",
  },
  {
    target: "directory",
    title: "People",
    body: "Every off-chain profile. Search by name, address or email, and delete a profile if you need to.",
  },
  { target: "guide", title: "Need this again?", body: "The guide is always one click away." },
];

/** The tour for the page at `pathname`. */
export function tourFor(pathname) {
  if (pathname.startsWith("/pets/")) return PET;
  return { "/dashboard": DASHBOARD, "/profile": PROFILE, "/admin": ADMIN }[pathname] ?? HOME;
}
