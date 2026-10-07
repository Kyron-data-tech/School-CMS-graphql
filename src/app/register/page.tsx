import { redirect } from "next/navigation";

export const metadata = {
  title: "Register | Greenfield International Academy",
  description: "Official registration portal at Greenfield International Academy.",
};

export default function RegisterPage() {
  redirect("/login?tab=register");
}

