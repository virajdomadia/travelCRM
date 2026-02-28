const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.user.updateMany({
        where: { email: "admin@travelos.com" },
        data: { failedLoginAttempts: 0, lockUntil: null },
    });
    console.log("Unlocked admin account:", result);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
