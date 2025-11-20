"use client";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/authClient";
import { GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

const SignIn = () => {
  const [email, setEmail] = useState<string>("example@abc.com");
  const [password, setPassword] = useState<string>("12345678");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { data, error, isPending } = authClient.useSession();
  const router = useRouter();

  const login = async (e: FormEvent) => {
    try {
      e.preventDefault();
      setIsLoading(true);
      //todo : add validation

      const data = await authClient.signIn.email({
        email,
        password,
        callbackURL: process.env.NEXT_PUBLIC_CLIENT_URL,
      });

      console.log(data);
    } catch (error) {
      console.log("Something went wrong while signing in.");
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const data = await authClient.signIn.social({
        provider: "google",
        callbackURL: process.env.NEXT_PUBLIC_CLIENT_URL,
      });
      console.log(data);
    } catch (error) {
      console.log("Something went wrong while logging with google");
      toast("Something went wrong while logging with google");
      console.log(error);
    }
  };

  useEffect(() => {
    if (!isPending && data?.user && data?.session) {
      router.push("/");
    }
  }, [data, isPending, router]);

  if (isPending) {
    return <Loading />;
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={"flex flex-col gap-6"}>
          <form onSubmit={login}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <a
                  href="#"
                  className="flex flex-col items-center gap-2 font-medium"
                >
                  <div className="flex size-8 items-center justify-center rounded-md">
                    <GalleryVerticalEnd className="size-6" />
                  </div>
                  <span className="sr-only">Arka CLI</span>
                </a>
                <h1 className="text-xl font-bold">Welcome to Arka CLI</h1>
                <FieldDescription>
                  Don&apos;t have an account?{" "}
                  <Link href="/sign-up">Sign up</Link>
                </FieldDescription>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="* * * * * * "
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Field>
                <Button type="submit">
                  {isLoading ? <Spinner /> : "Login"}
                </Button>
              </Field>
              <FieldSeparator>Or</FieldSeparator>
              <Field className="">
                <Button
                  variant="outline"
                  type="button"
                  onClick={loginWithGoogle}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
