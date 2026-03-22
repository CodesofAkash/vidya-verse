import { ModuleNavbar } from "@/components/landing/module-navbar";

export default function VidyaManchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <ModuleNavbar
        moduleName="VidyaManch"
        moduleHref="/vidya-manch"
        moduleImageSrc="/vidya-manch.png"
      />
      <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-10">{children}</main>
    </div>
  );
}
