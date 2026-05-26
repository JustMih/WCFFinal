/** Client-side enrichment when off-hours API is not deployed yet */

function normalizePhone(raw) {
  if (!raw) return "";
  let phone = String(raw).replace(/[^+\d]/g, "");
  if (phone.startsWith("255")) phone = "0" + phone.slice(3);
  if (phone.startsWith("+255")) phone = "0" + phone.slice(4);
  if (phone.startsWith("+")) phone = phone.slice(1);
  if (!phone.startsWith("0") && phone.length === 9) phone = "0" + phone;
  return phone;
}

export function parseCallerPhone(clid, src) {
  if (clid) {
    const angle = String(clid).match(/<([^>]+)>/);
    if (angle && angle[1]) {
      const p = normalizePhone(angle[1]);
      if (p.length >= 9) return p;
    }
  }
  const fromSrc = normalizePhone(src);
  if (fromSrc.length >= 9) return fromSrc;
  return "";
}

function extractPhonesFromText(text) {
  if (!text) return [];
  const matches = String(text).match(/\+?\d{9,15}/g) || [];
  return [...new Set(matches.map((m) => normalizePhone(m)).filter((p) => p.length >= 9))];
}

const EXCLUDED = new Set([
  normalizePhone("+255222211770"),
  normalizePhone("255222211770"),
]);

function extractPjsipDialTargets(text) {
  if (!text) return [];
  const out = [];
  const re = /PJSIP\/([^@,\s/]+)@/gi;
  let m;
  while ((m = re.exec(String(text))) !== null) {
    if (m[1]) out.push(m[1]);
  }
  return out;
}

function isExtensionDst(dst) {
  const s = String(dst || "").trim();
  return s.length <= 2 || /^[a-z]+$/i.test(s);
}

function pickRoute(record, callerPhone, emergencyByPhone) {
  const candidates = [];

  for (const field of [record.lastdata, record.dstchannel]) {
    for (const target of extractPjsipDialTargets(field)) {
      const n = normalizePhone(target);
      if (n && n.length >= 9 && n !== callerPhone && !EXCLUDED.has(n)) {
        candidates.unshift(target);
      }
    }
  }

  if (!isExtensionDst(record.dst)) {
    for (const phone of extractPhonesFromText(record.dst)) {
      if (phone && phone !== callerPhone && !EXCLUDED.has(phone)) candidates.push(phone);
    }
  }

  for (const field of [record.did, record.lastdata, record.dstchannel]) {
    for (const phone of extractPhonesFromText(field)) {
      if (phone && phone !== callerPhone && !EXCLUDED.has(phone)) candidates.push(phone);
    }
  }

  for (const phone of candidates) {
    const emergency = emergencyByPhone.get(phone);
    if (emergency) {
      return {
        routed_to: emergency.phone_number,
        routed_to_label: `Emergency #${emergency.priority} (${emergency.phone_number})`,
        is_emergency_route: true,
      };
    }
  }

  if (candidates[0]) {
    return {
      routed_to: candidates[0],
      routed_to_label: candidates[0],
      is_emergency_route: false,
    };
  }

  return {
    routed_to: null,
    routed_to_label: "—",
    is_emergency_route: false,
  };
}

export function enrichRecordClient(record, emergencyByPhone) {
  const caller_phone = parseCallerPhone(record.clid, record.src);
  const caller_display = caller_phone || record.clid || record.src || "—";
  const route = pickRoute(record, caller_phone, emergencyByPhone);

  return {
    ...record,
    caller_phone,
    caller_display,
    routed_to: route.routed_to,
    routed_to_label: route.routed_to_label,
    destination_display: route.routed_to_label,
    is_emergency_route:
      route.is_emergency_route ||
      String(record.userfield || "").toUpperCase() === "EMERGENCY" ||
      String(record.dcontext || "").toLowerCase().includes("emergency"),
  };
}

export function buildEmergencyMap(emergencyRows) {
  const map = new Map();
  for (const row of emergencyRows || []) {
    const n = normalizePhone(row.phone_number);
    if (n) map.set(n, row);
  }
  return map;
}
