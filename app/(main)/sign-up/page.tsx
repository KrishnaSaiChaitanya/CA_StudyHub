import { Message } from "@/components/shared/FormMessage";
import SignUpView from "./view";

export default async function SignUp(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return <SignUpView searchParams={searchParams} />;
}
