import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth, db } from "./firebase.js";
import { updateAppointmentStatus } from "./appointment-api.js";
import {
  canUserCancelAppointment,
  escapeHtml,
  getAppointmentClinicName,
  getAppointmentDisplayDate,
  getAppointmentDisplayTime,
  getAppointmentStatusMeta
} from "./ui-utils.js";
import { isAdminUser } from "./admin-utils.js";

function renderEmptyAppointments(listEl) {
  listEl.innerHTML = '<p style="color:var(--text-secondary);">No appointments booked yet. <a href="appointment.html" style="color:var(--primary);">Book one now</a>.</p>';
}

function renderAppointmentList(listEl, appointments) {
  listEl.innerHTML = "";

  appointments.forEach(({ id, data }) => {
    const statusMeta = getAppointmentStatusMeta(data.status);
    const clinicName = getAppointmentClinicName(data);
    const specialty = data.specialty
      ? `<p style="margin:0.35rem 0 0; color:var(--primary); font-size:0.85rem;">${escapeHtml(data.specialty)}</p>`
      : "";
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : "";
    const cancelAction = canUserCancelAppointment(data)
      ? `<button class="btn-outline dashboard-cancel-btn" data-id="${id}" style="margin-top:0.9rem;">Cancel Appointment</button>`
      : "";

    listEl.innerHTML += `
      <div class="glass-card" style="padding:1.25rem; margin-bottom:1rem; border-left:4px solid ${statusMeta.color};">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <strong style="font-size:1rem;">${escapeHtml(clinicName)}</strong><br>
            <span style="color:var(--text-secondary); font-size:0.9rem;">
              <i class='bx bx-calendar'></i> ${escapeHtml(getAppointmentDisplayDate(data))} &nbsp;
              <i class='bx bx-time'></i> ${escapeHtml(getAppointmentDisplayTime(data))}
            </span>
            ${specialty}
          </div>
          <span style="background:${statusMeta.color}22; color:${statusMeta.color}; padding:3px 10px;
            border-radius:20px; font-size:0.8rem; font-weight:600; text-transform:uppercase;">
            ${escapeHtml(statusMeta.label)}
          </span>
        </div>
        ${data.reason ? `<p style="margin:0.5rem 0 0; color:var(--text-secondary); font-size:0.9rem;">${escapeHtml(data.reason)}</p>` : ""}
        ${createdAt ? `<p style="margin:0.45rem 0 0; color:var(--text-muted); font-size:0.82rem;">Booked on ${escapeHtml(createdAt)}</p>` : ""}
        ${cancelAction}
      </div>`;
  });
}

function bindCancelActions(listEl) {
  listEl.querySelectorAll(".dashboard-cancel-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await updateAppointmentStatus({
          appointmentId: button.dataset.id,
          status: "cancelled"
        });
        button.disabled = true;
        button.textContent = "Cancelled";
        window.location.reload();
      } catch (error) {
        alert(error.message || "Unable to cancel appointment.");
      }
    });
  });
}

async function loadAppointments(user) {
  const listEl = document.getElementById("appointments-list");
  if (!listEl) return;

  try {
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(appointmentsQuery);

    if (snap.empty) {
      renderEmptyAppointments(listEl);
      return;
    }

    const appointments = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      data: docSnap.data()
    }));

    renderAppointmentList(listEl, appointments);
    bindCancelActions(listEl);
  } catch (error) {
    listEl.innerHTML = `<p style="color:#ef4444;">Could not load appointments: ${escapeHtml(error.message)}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const userName = document.getElementById("user-name");
    if (userName) {
      userName.textContent = user.displayName || user.email;
    }

    const adminCard = document.getElementById("admin-review-card");
    if (adminCard) {
      adminCard.style.display = await isAdminUser(user) ? "block" : "none";
    }

    await loadAppointments(user);
  });
});
