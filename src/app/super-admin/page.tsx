import { redirect } from "next/navigation";

// SUPER_ADMIN is redirected to /super-admin/agencies after login
export default function SuperAdminPage() {
    redirect("/super-admin/agencies");
}
