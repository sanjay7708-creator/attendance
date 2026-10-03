// =====================================================
//  LOGIN PAGE
// =====================================================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    sessionStorage.setItem("loggedIn", "yes");
                    window.location.href = "/dashboard.html";
                } else {
                    alert(data.message);
                }
            })
            .catch(() => alert("Unable to connect to the server."));
    });
}


// =====================================================
//  DASHBOARD PAGE
// =====================================================
const attendanceTable = document.getElementById("attendanceTable");

if (attendanceTable) {

    // Must be logged in
    if (sessionStorage.getItem("loggedIn") !== "yes") {
        window.location.href = "/index.html";
    }

    // ---------- Today's date ----------
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    document.getElementById("todayDate").textContent = `${dd}-${mm}-${yyyy}`;
    document.getElementById("workDate").value = `${yyyy}-${mm}-${dd}`;

    // ---------- Add / remove rows ----------
    function addRow() {
        const row = attendanceTable.insertRow();

        row.innerHTML = `
            <td><input type="text" class="emp-name" placeholder="Employee Name"></td>
            <td><input type="time" class="morning-in"></td>
            <td><input type="time" class="lunch-out"></td>
            <td><input type="time" class="lunch-in"></td>
            <td><input type="time" class="evening-out"></td>
            <td><input type="text" class="remarks" placeholder="Present"></td>
            <td><button type="button" class="removeBtn" title="Remove">✕</button></td>
        `;
    }

    document.getElementById("addRowBtn").addEventListener("click", addRow);

    attendanceTable.addEventListener("click", function (e) {
        if (e.target.classList.contains("removeBtn")) {
            // Always keep at least one row
            if (attendanceTable.rows.length > 1) {
                e.target.closest("tr").remove();
            }
        }
    });

    addRow(); // first row on page load

    // ---------- Save attendance ----------
    document.getElementById("saveAttendanceBtn").addEventListener("click", function () {

        const details = {
            date: document.getElementById("workDate").value,
            client: document.getElementById("client").value,
            site: document.getElementById("site").value.trim(),
            cleaningType: document.getElementById("cleaningType").value,
            permitType: document.getElementById("permitType").value,
            permitNumber: document.getElementById("permitNumber").value.trim(),
            location: document.getElementById("location").value.trim(),
            supervisor: document.getElementById("supervisor").value.trim(),
            waterBefore: document.getElementById("waterBefore").value,
            waterAfter: document.getElementById("waterAfter").value,
            workDetails: document.getElementById("workDetails").value.trim()
        };

        const employees = [];

        attendanceTable.querySelectorAll("tr").forEach(row => {
            const name = row.querySelector(".emp-name").value.trim();

            if (name === "") return; // skip empty rows

            employees.push({
                employeeName: name,
                morningIn: row.querySelector(".morning-in").value,
                lunchOut: row.querySelector(".lunch-out").value,
                lunchIn: row.querySelector(".lunch-in").value,
                eveningOut: row.querySelector(".evening-out").value,
                remarks: row.querySelector(".remarks").value.trim() || "Present"
            });
        });

        if (employees.length === 0) {
            alert("Please enter at least one employee name.");
            return;
        }

        fetch("/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ details, employees })
        })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                alert(data.message);

                if (ok) {
                    // Clear employee rows after a successful save
                    attendanceTable.innerHTML = "";
                    addRow();
                }
            })
            .catch(() => alert("Unable to save attendance. Is the server running?"));
    });
}