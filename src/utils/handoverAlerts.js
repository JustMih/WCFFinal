import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import "./handoverSwal.css";

const swalBase = {
  customClass: {
    container: "handover-swal-container",
    popup: "handover-swal-popup",
    title: "handover-swal-title",
    htmlContainer: "handover-swal-html",
    confirmButton: "handover-swal-confirm",
    cancelButton: "handover-swal-cancel",
  },
  buttonsStyling: true,
  showClass: {
    popup: "swal2-show",
  },
  hideClass: {
    popup: "swal2-hide",
  },
};

function formatDisplayDate(value) {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export async function confirmStartHandover({
  delegateName,
  returnDate,
  reason,
}) {
  const result = await Swal.fire({
    ...swalBase,
    title: "Start handover?",
    icon: "question",
    html: `
      <p style="margin:0 0 12px;line-height:1.5;color:#334155;">
        You are about to delegate your active tickets to
        <strong>${delegateName || "the selected user"}</strong>.
      </p>
      <ul style="text-align:left;margin:0;padding-left:1.2rem;color:#475569;font-size:0.95rem;">
        <li><strong>Return date:</strong> ${formatDisplayDate(returnDate)}</li>
        ${
          reason
            ? `<li><strong>Reason:</strong> ${reason}</li>`
            : ""
        }
      </ul>
      <p style="margin:12px 0 0;font-size:0.9rem;color:#64748b;">
        Your ticket actions will be locked until you revoke the handover.
      </p>
    `,
    showCancelButton: true,
    confirmButtonText: "Yes, start handover",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#0ea5e9",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
    focusCancel: true,
  });

  return result.isConfirmed;
}

export async function confirmRevokeHandover({ delegateName, lockMode = false } = {}) {
  const result = await Swal.fire({
    ...swalBase,
    title: "Revoke handover?",
    icon: "warning",
    html: `
      <p style="margin:0;line-height:1.5;color:#334155;">
        All delegated tickets will be returned to you
        ${
          delegateName
            ? ` from <strong>${delegateName}</strong>`
            : ""
        }.
      </p>
      <p style="margin:12px 0 0;font-size:0.9rem;color:#64748b;">
        ${
          lockMode
            ? "You will regain full access to the system immediately."
            : "You will regain full access to your tickets immediately."
        }
      </p>
    `,
    showCancelButton: true,
    confirmButtonText: "Yes, revoke",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
    focusCancel: true,
  });

  return result.isConfirmed;
}

export function showHandoverSuccess(message) {
  return Swal.fire({
    ...swalBase,
    title: "Success",
    text: message,
    icon: "success",
    confirmButtonColor: "#0ea5e9",
    timer: 2500,
    timerProgressBar: true,
  });
}

export function showHandoverError(message) {
  return Swal.fire({
    ...swalBase,
    title: "Error",
    text: message,
    icon: "error",
    confirmButtonColor: "#dc2626",
  });
}
