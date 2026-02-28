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

async function run() {
    console.log("Starting E2E API Flow without Prisma seeding...");

    try {
        // 1. Login as Super Admin to create a fresh Agency
        console.log("1. Logging in as Super Admin...");
        let res = await apiCall('/api/auth/login', 'POST', { email: 'admin@travelos.com', password: 'Admin@1234' });
        const superAdminCookie = extractCookie(res.cookies, 'auth-token');
        if (!superAdminCookie) throw new Error("Super Admin Auth Failed");

        // 2. Create Agency + Agency Admin
        const agencyName = `Test Agency ${Date.now()}`;
        console.log(`2. Creating Agency: ${agencyName}...`);
        res = await apiCall('/api/super-admin/agencies/create', 'POST', {
            agencyName: agencyName,
            agencyEmail: `contact@${Date.now()}.com`,
            subscriptionPlan: 'STARTER',
            adminEmail: `admin@${Date.now()}.com`,
            adminPassword: 'Password@1234'
        }, superAdminCookie);

        if (res.status !== 201) throw new Error(`Agency creation failed: ${JSON.stringify(res.data)}`);
        const agencyAdminEmail = res.data.adminUser.email;

        // 3. Login as the new Agency Admin
        console.log("3. Logging in as the new Agency Admin...");
        res = await apiCall('/api/auth/login', 'POST', { email: agencyAdminEmail, password: 'Password@1234' });
        const agencyAdminCookie = extractCookie(res.cookies, 'auth-token');
        if (!agencyAdminCookie) throw new Error("Agency Admin Auth Failed");

        // 4. Create Employee 1 and Employee 2
        console.log("4. Creating 2 Employees...");
        const emp1Email = `emp1_${Date.now()}@test.com`;
        res = await apiCall('/api/agency/employees', 'POST', {
            email: emp1Email,
            password: 'Password@1234',
            role: 'AGENCY_EMPLOYEE'
        }, agencyAdminCookie);
        if (res.status !== 201) throw new Error(`Emp 1 creation failed: ${JSON.stringify(res.data)}`);
        const emp1Id = res.data.employee.id;

        const emp2Email = `emp2_${Date.now()}@test.com`;
        res = await apiCall('/api/agency/employees', 'POST', {
            email: emp2Email,
            password: 'Password@1234',
            role: 'AGENCY_EMPLOYEE'
        }, agencyAdminCookie);
        if (res.status !== 201) throw new Error(`Emp 2 creation failed: ${JSON.stringify(res.data)}`);
        const emp2Id = res.data.employee.id;

        // 5. Create a Lead
        console.log("5. Creating a Lead...");
        res = await apiCall('/api/agency/leads', 'POST', {
            name: "Isolation Test Lead",
            email: `lead_${Date.now()}@test.com`,
            phone: "555-0000",
            source: "Website"
        }, agencyAdminCookie);
        if (res.status !== 201) throw new Error(`Lead creation failed: ${JSON.stringify(res.data)}`);
        const leadId = res.data.lead.id;

        // 6. Assign the lead to Employee 1
        console.log(`6. Assigning Lead to Employee 1 (${emp1Email})...`);
        res = await apiCall(`/api/agency/leads/${leadId}/assign`, 'PATCH', {
            assignedToId: emp1Id
        }, agencyAdminCookie);
        if (res.status !== 200) throw new Error(`Lead assignment failed: ${JSON.stringify(res.data)}`);

        // 7. Verify Employee 1 CAN see the lead
        console.log("7. Logging in as Employee 1. Verifying they CAN see the lead...");
        res = await apiCall('/api/auth/login', 'POST', { email: emp1Email, password: 'Password@1234' });
        const emp1Cookie = extractCookie(res.cookies, 'auth-token');

        let leadListRes = await apiCall('/api/agency/leads?page=1&limit=10', 'GET', null, emp1Cookie);
        if (leadListRes.data.leads.length === 0 || leadListRes.data.leads[0].id !== leadId) {
            throw new Error("Employee 1 CANNOT see their assigned lead in the list!");
        }
        console.log("  - [PASS] Employee 1 successfully saw the lead assigned to them.");


        // 8. Verify Employee 2 CANNOT see the lead
        console.log("8. Logging in as Employee 2. Verifying they CANNOT see the lead...");
        res = await apiCall('/api/auth/login', 'POST', { email: emp2Email, password: 'Password@1234' });
        const emp2Cookie = extractCookie(res.cookies, 'auth-token');

        leadListRes = await apiCall('/api/agency/leads?page=1&limit=10', 'GET', null, emp2Cookie);
        if (leadListRes.data.leads.length !== 0) {
            throw new Error(`Employee 2 CAN see leads! Found ${leadListRes.data.leads.length} leads.`);
        }
        console.log("  - [PASS] Employee 2 cannot see the lead assigned to Employee 1. Isolation is active.");

        // 9. Create Agency 2 and Verify Cross-Agency Sandbox
        console.log("9. Creating Agency 2 for Cross-Tenant Sandbox Test...");
        const agencyName2 = `Cross Agency ${Date.now()}`;
        res = await apiCall('/api/super-admin/agencies/create', 'POST', {
            agencyName: agencyName2,
            agencyEmail: `contact2@${Date.now()}.com`,
            subscriptionPlan: 'STARTER',
            adminEmail: `admin2@${Date.now()}.com`,
            adminPassword: 'Password@1234'
        }, superAdminCookie);

        if (res.status !== 201) throw new Error(`Agency 2 creation failed: ${JSON.stringify(res.data)}`);
        const agencyAdminEmail2 = res.data.adminUser.email;

        // 10. Login as Agency 2 Admin
        console.log("10. Logging in as Agency 2 Admin...");
        res = await apiCall('/api/auth/login', 'POST', { email: agencyAdminEmail2, password: 'Password@1234' });
        const agencyAdmin2Cookie = extractCookie(res.cookies, 'auth-token');

        // 11. Verify Agency 2 Admin CANNOT see Agency 1's lead
        console.log("11. Verifying Agency 2 Admin CANNOT see Agency 1's lead in list...");
        leadListRes = await apiCall('/api/agency/leads?page=1&limit=10', 'GET', null, agencyAdmin2Cookie);
        if (leadListRes.data.leads.length !== 0) {
            throw new Error(`Agency 2 Admin CAN see Agency 1 leads! Found ${leadListRes.data.leads.length} leads.`);
        }
        console.log("  - [PASS] Agency 2 list is empty and strictly isolated.");

        // 12. Try to fetch Agency 1's lead by ID explicitly
        console.log("12. Verifying Agency 2 Admin CANNOT fetch Agency 1 lead by explicit ID...");
        res = await apiCall(`/api/agency/leads/${leadId}`, 'GET', null, agencyAdmin2Cookie);
        if (res.status !== 404) {
            throw new Error(`Agency 2 Admin was able to access Agency 1 lead by ID! Expected 404, got ${res.status}`);
        }
        console.log("  - [PASS] Explicit ID fetch appropriately returned 404 across tenants.");

        console.log("\n=== ALL ISOLATION E2E TESTS PASSED SUCCESSFULLY ===");

    } catch (e) {
        console.error("\n[TEST FAILED]:", e.message);
        console.error(e);
        process.exit(1);
    }
}

run();
