import { MdOutlineAudiotrack } from "react-icons/md";
import { TbActivityHeartbeat } from "react-icons/tb";
import { FaRegFileAlt } from "react-icons/fa";

export const IVR_CATEGORIES = [
  {
    key: "audio",
    label: "Audio Files",
    color: "#2563eb",
    icon: MdOutlineAudiotrack,
    iconSize: 32,
    cards: [
      { to: "/ivr-voices", label: "IVR's Voices", icon: MdOutlineAudiotrack },
      { to: "/recorded-audio", label: "Recorded Calls", icon: MdOutlineAudiotrack },
      { to: "/voice-notes", label: "Voice Notes", icon: MdOutlineAudiotrack },
    ],
  },
  {
    key: "actions",
    label: "IVR Actions",
    color: "#10b981",
    icon: TbActivityHeartbeat,
    iconSize: 32,
    cards: [
      { to: "/ivr-dtmf-mappings", label: "IVR's Mapping", icon: TbActivityHeartbeat },
      { to: "/ivr-action", label: "IVR's Actions", icon: TbActivityHeartbeat },
      { to: "/ivr-emegency", label: "IVR Emergency Number", icon: MdOutlineAudiotrack },
      { to: "/ivr-holidays", label: "IVR Holidays", icon: MdOutlineAudiotrack },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    color: "#f59e42",
    icon: FaRegFileAlt,
    iconSize: 32,
    cards: [
      { to: "/ivr-interactions", label: "IVR Interactions Reports", icon: MdOutlineAudiotrack },
      { to: "/livestream", label: "Live Streaming", icon: MdOutlineAudiotrack },
      { to: "/dtmf-stats", label: "DTMF Usage Report", icon: MdOutlineAudiotrack },
    ],
  },
];

