import { ModuleNavbar } from "@/components/landing/module-navbar";

export default function VidyaVaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <ModuleNavbar
        moduleName="VidyaVault"
        moduleHref="/vidya-vault"
        moduleImageSrc="/vidya-vault.png"
      />
      <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-10">{children}</main>
    </div>
  );
}
