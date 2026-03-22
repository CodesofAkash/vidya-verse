import { ModuleNavbar } from "@/components/landing/module-navbar";

export default function VidyaSangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <ModuleNavbar
        moduleName="VidyaSang"
        moduleHref="/vidya-sang"
        moduleImageSrc="/vidya-sang.png"
      />
      <div className="pt-24 pb-12 px-6">{children}</div>
    </div>
  );
}