import { Message } from "@/components/shared/FormMessage";
import SignInView from "./view";

export default async function SignIn(props: {
  searchParams: Promise<any>;
}) {
  const searchParams = await props.searchParams;
  const redirectTo = (searchParams.redirect_to as string) || "/dashboard";
  return <SignInView searchParams={searchParams} redirectTo={redirectTo} />;
}