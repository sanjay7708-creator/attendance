const express = require("express");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");

const app = express();
const PORT = 3000;

// Project root (the folder above "backend")
const ROOT = path.join(__dirname, "..");
const EXCEL_FILE = path.join(__dirname, "attendance.xlsx");
const SHEET_NAME = "Attendance";

// Column order in the Excel sheet
const COLUMNS = [
    "Date", "Client", "Site", "Cleaning Type", "Permit Type", "Permit Number",
    "Roof / Location", "Supervisor", "Water Before", "Water After", "Work Details",
    "Employee Name", "Morning In", "Lunch Out", "Lunch In", "Evening Out", "Remarks"
];

app.use(express.json());


app.get("/", (req, res) => res.sendFile(path.join(ROOT, "index.html")));
app.get("/index.html", (req, res) => res.sendFile(path.join(ROOT, "index.html")));
app.get("/dashboard.html", (req, res) => res.sendFile(path.join(ROOT, "dashboard.html")));
app.get("/script.js", (req, res) => res.sendFile(path.join(ROOT, "script.js")));
app.get("/style.css", (req, res) => res.sendFile(path.join(ROOT, "style.css")));

// ---------- LOGIN ----------
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "1234") {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: "Invalid Username or Password" });
    }
});

// ---------- SAVE ATTENDANCE ----------
app.post("/attendance", (req, res) => {
    const { details, employees } = req.body;
    console.log(JSON.stringify(req.body, null, 2));

    if (!details || !Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({ message: "No employee data to save." });
    }

    // One Excel row per employee (work details repeated on every row)
    const newRows = employees.map(emp => ({
        "Date": details.date,
        "Client": details.client,
        "Site": details.site,
        "Cleaning Type": details.cleaningType,
        "Permit Type": details.permitType,
        "Permit Number": details.permitNumber,
        "Roof / Location": details.location,
        "Supervisor": details.supervisor,
        "Water Before": details.waterBefore,
        "Water After": details.waterAfter,
        "Work Details": details.workDetails,
        "Employee Name": emp.employeeName,
        "Morning In": emp.morningIn,
        "Lunch Out": emp.lunchOut,
        "Lunch In": emp.lunchIn,
        "Evening Out": emp.eveningOut,
        "Remarks": emp.remarks
    }));

    try {
        let workbook;
        let allRows = [];

        if (fs.existsSync(EXCEL_FILE)) {
            workbook = XLSX.readFile(EXCEL_FILE);
            if (workbook.Sheets[SHEET_NAME]) {
                allRows = XLSX.utils.sheet_to_json(workbook.Sheets[SHEET_NAME]);
            }
        } else {
            workbook = XLSX.utils.book_new();
        }

        allRows.push(...newRows);

        const sheet = XLSX.utils.json_to_sheet(allRows, { header: COLUMNS });
        sheet["!cols"] = COLUMNS.map(name => ({ wch: Math.max(name.length + 2, 16) }));

        if (workbook.Sheets[SHEET_NAME]) {
            workbook.Sheets[SHEET_NAME] = sheet;
        } else {
            XLSX.utils.book_append_sheet(workbook, sheet, SHEET_NAME);
        }

        XLSX.writeFile(workbook, EXCEL_FILE);

        console.log(`Saved ${newRows.length} row(s) to ${EXCEL_FILE}`);
        res.json({ message: `Attendance saved to Excel (${newRows.length} employee(s)).` });

    } catch (error) {
        console.error("Excel save error:", error.message);
        res.status(500).json({
            message: "Could not save. If attendance.xlsx is open in Excel, close it and try again."
        });
    }
});

app.listen(PORT, () => {
    console.log("Server started: http://localhost:" + PORT);
});