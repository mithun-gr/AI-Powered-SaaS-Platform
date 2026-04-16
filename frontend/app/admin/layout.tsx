import { Metadata } from "next";
import AdminLayoutClient from "./layout-client";

export const metadata: Metadata = {
    title: "Morchantra - Admin",
    description: "Admin Dashboard for Morchantra",
};

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
