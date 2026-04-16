import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Morchantra - Client Login",
    description: "Secure login for Morchantra Client Portal",
};

export default function LoginLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
