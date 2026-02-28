const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
    try {
        const passwordHash = await bcrypt.hash("TestPass@123", 10);

        // Create Agency
        let agency = await prisma.agency.findUnique({ where: { email: "leadtest@agency.com" } });
        if (!agency) {
            agency = await prisma.agency.create({
                data: { name: "Lead Test Agency", email: "leadtest@agency.com", subscriptionPlan: "FREE" }
            });
        }

        // Create Agency Admin
        let admin = await prisma.user.findUnique({ where: { email: "admin@leadtest.com" } });
        if (!admin) {
            admin = await prisma.user.create({
                data: {
                    email: "admin@leadtest.com",
                    password: passwordHash,
                    role: "AGENCY_ADMIN",
                    agencyId: agency.id,
                }
            });
        }

        // Create Employee
        let employee = await prisma.user.findUnique({ where: { email: "emp@leadtest.com" } });
        if (!employee) {
            employee = await prisma.user.create({
                data: {
                    email: "emp@leadtest.com",
                    password: passwordHash,
                    role: "AGENCY_EMPLOYEE",
                    agencyId: agency.id,
                }
            });
        }

        console.log(JSON.stringify({
            adminEmail: "admin@leadtest.com",
            empEmail: "emp@leadtest.com",
            password: "TestPass@123",
            agencyId: agency.id
        }));
    } catch (error) {
        console.error("Setup error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
