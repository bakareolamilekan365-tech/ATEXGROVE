import { LoginForm } from "@/components/auth/LoginForm";
import { FormCard } from "@/components/ui/FormCard";
import { privatePreviewEnabled, publicRegistrationEnabled } from "@/lib/config/private-preview";

export default function LoginPage() {
  return (
    <FormCard eyebrow="Welcome back" title="Sign in" intro="Customers and staff use the same email and password sign-in.">
      <LoginForm registrationEnabled={publicRegistrationEnabled()} previewWarning={privatePreviewEnabled()} />
    </FormCard>
  );
}
