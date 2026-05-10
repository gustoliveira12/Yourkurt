"use client";
import MobileNav from "@/components/navegacao/MobileNav";
import MobileHeader from "@/components/navegacao/MobileHeader";
import ProfileSidebar from "@/components/navegacao/ProfileSidebar";
import { user } from "@/lib/user";
import { HouseIcon } from "@phosphor-icons/react";

export default function LoginPage() {
  const NavLinks = [
    {
      text: "Feed",
      redirect: "/",
      icon: HouseIcon,
    },
  ];
  return (
    <div className="w-full h-screen bg-background responsive pt-20">
      <MobileHeader />
      <div className="flex flex-col">
        <ProfileSidebar
          alt="string"
          size={1}
          prop={NavLinks}
          name="Lucas Silva"
          at="lucas.silva"
          src={user.img}
        />
        <ProfileSidebar
          alt="string"
          size={1}
          prop={NavLinks}
          name="Lucas Silva"
          at="lucas.silva"
          src={user.img}
        />
      </div>
      <MobileNav />
    </div>
  );
}
