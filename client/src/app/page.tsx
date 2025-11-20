"use client";
import Loading from "@/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/authClient";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data, error, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !data?.session && !data?.user) {
      router.push("/sign-in");
    }
  }, [data, isPending, router]);

  const logout = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.log(error);
    }
  };

  if (isPending) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {/* <h1 className="text-4xl font-bold">Welcome to the Home Page</h1> */}

      <Card className="w-full max-w-md">
        <CardContent className="mx-auto">
          <Avatar className="h-24 w-24 mx-auto mt-6 mb-4 text-3xl">
            <AvatarImage src={data?.user.image || ""} alt="avatar-img" />
            <AvatarFallback>
              {data?.user.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <p className="text-center text-xl font-medium">
            {data?.user.name || "User"}
          </p>
          <p className="text-center">{data?.user.email || "email"}</p>
          <Separator />
        </CardContent>
        <Button variant={"destructive"} onClick={logout}>
          logout
        </Button>
      </Card>
    </div>
  );
}
