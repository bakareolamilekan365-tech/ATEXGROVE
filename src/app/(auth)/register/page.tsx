import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { FormCard } from "@/components/ui/FormCard";
import { privatePreviewEnabled } from "@/lib/config/private-preview";

export default function RegisterPage() {
  if (privatePreviewEnabled()) {
    return (
      <FormCard eyebrow="Private preview" title="Approved accounts only" intro="Public registration is unavailable during the private preview.">
        <p className="muted">If you have an approved account, sign in with the email address provided to you.</p>
        <Link className="button button--primary button--full" href="/login">Go to sign in</Link>
      </FormCard>
    );
  }
  return (
    <FormCard eyebrow="New customer" title="Create your account" intro="Create a customer account to start and follow a request.">
      <RegisterForm />
      <p><Link href="/login">Already have an account?</Link></p>
    </FormCard>
  );
}
