import CallCenterIvr from "./CallCenterIvr";
import CallCenterIvrActions from "../call-center-ivr-actions/CallCenterIvrActions";
import CallCenterIvrDTMFMapping from "./CallCenterIvrActions";
import RecordedAudio from "./RecordedAudio";
import HolidayManager from "./HolidayManager";
import EmegencyManager from "./EmergencyManager";
import VoiceNotesReport from "./VoiceNotesReport";

/** Map IVR card routes to page components for tab panels (Audio + Actions only). */
export const IVR_PAGE_COMPONENTS = {
  "/ivr-voices": CallCenterIvr,
  "/recorded-audio": RecordedAudio,
  "/voice-notes": VoiceNotesReport,
  "/ivr-dtmf-mappings": CallCenterIvrDTMFMapping,
  "/ivr-action": CallCenterIvrActions,
  "/ivr-emegency": EmegencyManager,
  "/ivr-holidays": HolidayManager,
};
