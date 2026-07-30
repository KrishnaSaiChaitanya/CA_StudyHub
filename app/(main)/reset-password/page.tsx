import { Message } from "@/components/shared/FormMessage";
import ResetPasswordView from "./view";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return <ResetPasswordView searchParams={searchParams} />;
}
