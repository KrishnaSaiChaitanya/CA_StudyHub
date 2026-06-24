import { Message } from "@/components/form-message";
import ResetPasswordView from "@/features/auth/components/ResetPasswordView";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return <ResetPasswordView searchParams={searchParams} />;
}
