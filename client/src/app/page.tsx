"use client";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/authClient";
import { useEffect } from "react";

export default function Home() {
  const { data, error, isPending } = authClient.useSession();

  if (!isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {/* <Button>Click Me</Button> */}
      <h1 className="text-4xl font-bold">Welcome to the Home Page</h1>
    </div>
  );
}
