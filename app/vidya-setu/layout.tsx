import { ModuleNavbar } from "@/components/landing/module-navbar";

export default function VidyaSetuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <ModuleNavbar
        moduleName="VidyaSetu"
        moduleHref="/vidya-setu"
        moduleImageSrc="/vidya-setu.png"
      />
      <div className="pt-24 pb-12 px-6">{children}</div>
    </div>
  );
}