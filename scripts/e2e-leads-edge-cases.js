const http = require('http');

async function apiCall(path, method, body, cookie = null) {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    if (cookie) {
        options.headers['Cookie'] = cookie;
    }

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            let setCookie = res.headers['set-cookie'];
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let json;
                try { json = JSON.parse(data); } catch (e) { json = data; }
                resolve({ status: res.statusCode, data: json, cookies: setCookie });
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

function extractCookie(cookies, name) {
    if (!cookies) return null;
    const cookie = cookies.find(c => c.startsWith(name + '='));
    return cookie ? cookie.split(';')[0] : null;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log("Starting E2E Edge Cases Test for Leads Module...");
    await sleep(2000); // Give dev server a moment to compile route

    let adminCookie, empCookie, otherEmpCookie;

    try {
        console.log("1. Seeding Test Agencies/Users via Next.js API... Waiting for server to boot");
        let setupRes;
        for (let i = 0; i < 5; i++) {
            try {
                setupRes = await apiCall('/api/setup-e2e-edge', 'GET', null);
                if (setupRes.status === 200) break;
            } catch (err) {
                // Ignore connection errors during boot
            }
            console.log("   Server not ready, retrying in 3s...");
            await sleep(3000);
        }

        if (!setupRes || setupRes.status !== 200) throw new Error("Setup failed: " + JSON.stringify(setupRes?.data || "Timeout"));
        const { emp1Id, emp2Id } = setupRes.data;

        console.log("2. Authenticating Users...");
        let res = await apiCall('/api/auth/login', 'POST', { email: 'admin@agency1.com', password: 'Test@1234' });
        adminCookie = extractCookie(res.cookies, 'auth-token');

        if (!adminCookie) throw new Error(`Admin auth failed. Status: ${res.status}. Data: ${JSON.stringify(res.data)}`);

        res = await apiCall('/api/auth/login', 'POST', { email: 'emp@agency1.com', password: 'Test@1234' });
        empCookie = extractCookie(res.cookies, 'auth-token');
        if (!empCookie) throw new Error(`Emp auth failed. Status: ${res.status}. Data: ${JSON.stringify(res.data)}`);

        res = await apiCall('/api/auth/login', 'POST', { email: 'emp@agency2.com', password: 'Test@1234' });
        otherEmpCookie = extractCookie(res.cookies, 'auth-token');
        if (!otherEmpCookie) throw new Error(`Emp2 auth failed. Status: ${res.status}. Data: ${JSON.stringify(res.data)}`);

        console.log("3. Testing Validation Edge Cases...");
        // 3a. Invalid Email
        res = await apiCall('/api/agency/leads', 'POST', { name: "Test Lead", email: "invalid-email", source: "Website" }, adminCookie);
        if (res.status !== 400 || !res.data.errors) throw new Error(`Expected 400 Invalid Email, got ${res.status}`);
        console.log("  - [PASS] Invalid Email rejected.");

        // 3b. Missing Name
        res = await apiCall('/api/agency/leads', 'POST', { email: "test@test.com", source: "Website" }, adminCookie);
        if (res.status !== 400) throw new Error(`Expected 400 Missing Name, got ${res.status}`);
        console.log("  - [PASS] Missing Name rejected.");

        console.log("4. Testing RBAC restrictions...");
        // 4a. Admin creates unassigned lead
        res = await apiCall('/api/agency/leads', 'POST', { name: "Admin Unassigned", email: "unassigned@admin.com", source: "Website" }, adminCookie);
        const unassignedLeadId = res.data.lead.id;

        // 4b. Employee tries to fetch unassigned lead (should NOT be visible)
        res = await apiCall(`/api/agency/leads/${unassignedLeadId}`, 'GET', null, empCookie);
        if (res.status !== 404) throw new Error(`Expected 404 for Employee accessing unassigned lead, got ${res.status}`);
        console.log("  - [PASS] Employee cannot access unassigned lead.");

        // 4c. Employee tries to fetch leads list (should be empty for them)
        res = await apiCall(`/api/agency/leads?page=1&limit=10`, 'GET', null, empCookie);
        if (res.data.leads.length !== 0) throw new Error(`Expected Employee lead list to be 0, got ${res.data.leads.length}`);
        console.log("  - [PASS] Employee list filters out unassigned leads.");

        console.log("5. Testing Assignment flows...");
        // 5a. Admin assigns lead to Employee 1
        res = await apiCall(`/api/agency/leads/${unassignedLeadId}/assign`, 'PATCH', { assignedToId: emp1Id }, adminCookie);
        if (res.status !== 200) throw new Error("Admin failed to assign lead to Employee 1. Got: " + JSON.stringify(res.data));

        // 5b. Employee CAN now see lead
        res = await apiCall(`/api/agency/leads/${unassignedLeadId}`, 'GET', null, empCookie);
        if (res.status !== 200) throw new Error(`Employee cannot see assigned lead. Status: ${res.status}`);
        console.log("  - [PASS] Employee can access newly assigned lead.");

        // 5c. Employee updates assignment to another agency's employee (Should Fail)
        res = await apiCall(`/api/agency/leads/${unassignedLeadId}/assign`, 'PATCH', { assignedToId: emp2Id }, empCookie);
        if (res.status !== 400 && res.status !== 404) throw new Error(`Expected 400 cross-agency assignment, got ${res.status} JSON: ${JSON.stringify(res.data)}`);
        console.log("  - [PASS] Blocked cross-agency assignment.");

        console.log("6. Testing Status Update...");
        // 6a. Employee changes status of assigned lead
        res = await apiCall(`/api/agency/leads/${unassignedLeadId}/status`, 'PATCH', { status: 'CONTACTED' }, empCookie);
        if (res.status !== 200) throw new Error(`Employee failed to change status, got ${res.status}`);

        // 6b. Check audit logs to ensure status change was captured
        res = await apiCall(`/api/agency/leads/${unassignedLeadId}`, 'GET', null, adminCookie);
        const auditLog = res.data.auditLogs?.find?.(log => log.action === 'LEAD_STATUS_CHANGED');
        if (!auditLog || auditLog.metadata.newStatus !== 'CONTACTED') throw new Error("Audit log not capturing status change properly");
        console.log("  - [PASS] Status changed and verified in Audit Logs.");

        console.log("7. Testing Notes...");
        // 7a. Employee adds a note
        res = await apiCall(`/api/agency/leads/${unassignedLeadId}/notes`, 'POST', { content: 'Test note from emp' }, empCookie);
        if (res.status !== 201) throw new Error(`Employee failed to add note: ${res.status}`);

        res = await apiCall(`/api/agency/leads/${unassignedLeadId}`, 'GET', null, empCookie);
        if (res.data.notes.length === 0) throw new Error("Note was not returned in payload");
        console.log("  - [PASS] Note successfully added and retrieved.");

        console.log();
        console.log("=== ALL EDGE CASE E2E TESTS PASSED SUCCESSFULLY ===");

    } catch (e) {
        console.error("\n[TEST FAILED]:", e.message);
        console.error(e);
        process.exit(1);
    }
}

run();
