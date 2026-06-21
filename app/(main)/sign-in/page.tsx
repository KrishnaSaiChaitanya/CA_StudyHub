import { Message } from "@/components/form-message";
import SignInView from "@/features/auth/components/SignInView";

export default async function SignIn(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return <SignInView searchParams={searchParams} />;
}