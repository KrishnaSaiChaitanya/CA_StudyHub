import { Message } from "@/components/shared/FormMessage";
import SignInView from "./view";

export default async function SignIn(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return <SignInView searchParams={searchParams} />;
}