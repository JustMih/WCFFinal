import CallCenterIvr from "./CallCenterIvr";
import CallCenterIvrActions from "../call-center-ivr-actions/CallCenterIvrActions";
import CallCenterIvrDTMFMapping from "./CallCenterIvrActions";
import RecordedAudio from "./RecordedAudio";
import HolidayManager from "./HolidayManager";
import EmegencyManager from "./EmergencyManager";
import VoiceNotesReport from "./VoiceNotesReport";
import IVRInteractions from "./IVRInteractions";
import Livestream from "./Livestream";
import DTMFStats from "./DTMFStats";
import OffHoursReport from "../call-center-report/OffHoursReport";
import VoiceNoteReport from "../call-center-report/voice-note-report";

/** Map IVR card routes to page components for tab panels */
export const IVR_PAGE_COMPONENTS = {
  "/ivr-voices": CallCenterIvr,
  "/recorded-audio": RecordedAudio,
  "/voice-notes": VoiceNotesReport,
  "/ivr-dtmf-mappings": CallCenterIvrDTMFMapping,
  "/ivr-action": CallCenterIvrActions,
  "/ivr-emegency": EmegencyManager,
  "/ivr-holidays": HolidayManager,
  "/cdr-reports": VoiceNoteReport,
  "/ivr-interactions": IVRInteractions,
  "/livestream": Livestream,
  "/dtmf-stats": DTMFStats,
  "/off-hours-report": OffHoursReport,
};
