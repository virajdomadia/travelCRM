const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
    console.log("Creating Test Agency...");
    const agency = await prisma.agency.create({
        data: {
            name: "Test Travel Agency",
            email: "agency@example.com",
            planLimitUsers: 10,
        },
    });

    console.log("Creating Agency Admin...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    const admin = await prisma.user.create({
        data: {
            email: "admin@agency.com",
            password: hashedPassword,
            role: "AGENCY_ADMIN",
            agencyId: agency.id,
        },
    });

    console.log("Success!");
    console.log("Login with: admin@agency.com / password123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
