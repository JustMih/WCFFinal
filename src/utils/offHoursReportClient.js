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
    const digits = String(clid).replace(/[^\d+]/g, "");
    const p = normalizePhone(digits);
    if (p.length >= 9) return p;
  }
  const fromSrc = normalizePhone(src);
  if (fromSrc.length >= 9) return fromSrc;
  return "";
}

function isPlausibleTanzaniaPhone(normalized) {
  if (!normalized) return false;
  const d = String(normalized).replace(/\D/g, "");
  return d.length === 10 && d.startsWith("0");
}

function extractPhonesFromText(text) {
  if (!text) return [];
  const matches = String(text).match(/\+?\d{9,15}/g) || [];
  return [
    ...new Set(
      matches
        .map((m) => normalizePhone(m))
        .filter((p) => isPlausibleTanzaniaPhone(p))
    ),
  ];
}

const EXCLUDED = new Set([
  normalizePhone("+255222211770"),
  normalizePhone("255222211770"),
]);

function extractPjsipEgaTargets(text) {
  if (!text) return [];
  const out = [];
  const re = /PJSIP\/([^@,\s/]+)@eGA/gi;
  let m;
  while ((m = re.exec(String(text))) !== null) {
    if (m[1]) out.push(m[1].trim());
  }
  return out;
}

function extractPjsipDialTargets(text) {
  if (!text) return [];
  const out = [];
  const re = /PJSIP\/([^@,\s/]+)@/gi;
  let m;
  while ((m = re.exec(String(text))) !== null) {
    if (m[1]) out.push(m[1].trim());
  }
  return out;
}

function isExtensionDst(dst) {
  const s = String(dst || "").trim();
  if (/^\d{9,}$/.test(s.replace(/\D/g, ""))) return false;
  return s.length <= 2 || /^[a-z]+$/i.test(s);
}

function isEmergencyDialContext(record) {
  const uf = String(record?.userfield || "").toUpperCase();
  const ctx = String(record?.dcontext || "").toLowerCase();
  return uf === "EMERGENCY" || ctx.includes("emergency");
}

function pickRoute(record, callerPhone, emergencyByPhone) {
  const exclude = new Set([callerPhone].filter(Boolean));
  const ega = [];
  const pjsip = [];
  const other = [];
  const seen = new Set();

  const add = (raw, bucket, priority = false) => {
    if (!raw) return;
    const s = String(raw).trim();
    if (!s || seen.has(s)) return;
    const n = normalizePhone(s);
    if (EXCLUDED.has(n)) return;
    const emergency = emergencyByPhone.get(n);
    if (!emergency) return;
    seen.add(s);
    if (priority) bucket.unshift(s);
    else bucket.push(s);
  };

  for (const field of [record.lastdata, record.dstchannel]) {
    for (const target of extractPjsipEgaTargets(field)) {
      add(target, ega, true);
    }
  }

  for (const field of [record.lastdata, record.dstchannel]) {
    for (const target of extractPjsipDialTargets(field)) {
      if (!String(field).includes("@eGA")) add(target, pjsip, true);
    }
  }

  if (
    isEmergencyDialContext(record) &&
    !isExtensionDst(record.dst)
  ) {
    add(record.dst, other);
  }
  if (isEmergencyDialContext(record) && record.did) {
    add(record.did, other);
  }

  const tryLists = [ega, pjsip, other];
  for (const list of tryLists) {
    for (const raw of list) {
      const phone = normalizePhone(raw);
      if (!phone || exclude.has(phone) || phone === callerPhone) continue;
      const emergency = emergencyByPhone.get(phone);
      if (emergency) {
        return {
          routed_to: emergency.phone_number,
          routed_to_label: `Emergency #${emergency.priority} (${emergency.phone_number})`,
          is_emergency_route: true,
        };
      }
    }
  }

  return {
    routed_to: null,
    routed_to_label: "—",
    is_emergency_route: false,
  };
}

export function enrichRecordClient(record, emergencyByPhone, source) {
  const caller_phone = parseCallerPhone(record.clid, record.src);
  const caller_display = caller_phone || record.clid || record.src || "—";
  const route =
    source === "cdr" || source === "voice-notes"
      ? pickRoute(record, caller_phone, emergencyByPhone)
      : {
          routed_to: null,
          routed_to_label: "—",
          is_emergency_route: false,
        };

  return {
    ...record,
    caller_phone,
    caller_display,
    routed_to: route.routed_to,
    routed_to_label: route.routed_to_label,
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
