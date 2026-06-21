import { Message } from "@/components/form-message";
import SignUpView from "@/features/auth/components/SignUpView";

export default async function SignUp(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return <SignUpView searchParams={searchParams} />;
}
