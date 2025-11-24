"use client";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/authClient";
import { Smartphone } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const DevicePage = () => {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const code = searchParams.get("user_code");
  const [userCode, setUserCode] = useState(code || "");
  const router = useRouter();

  const { data, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !data?.user && !data?.session) {
      const currentPath = `/device${code ? `?user_code=${code}` : ""}`;
      router.push(`/sign-in?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [data, isPending, router, code]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Format the code: remove dashes and convert to uppercase
      const formattedCode = userCode.trim().replace(/-/g, "").toUpperCase();

      if (formattedCode.length !== 8) {
        setError("Please enter a valid 8-character code");
        return;
      }

      // Check if the code is valid using GET /device endpoint
      const response = await authClient.device({
        query: { user_code: formattedCode },
      });

      if (response.data) {
        // Redirect to approval page
        router.push(`/approve?user_code=${formattedCode}`);
      }
    } catch (err) {
      setError("Invalid or expired code");
      toast.error("Invalid or expired code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
    return <Loading />;
  }

  if (!data?.user) {
    return null;
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <Smartphone className="size-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Device Authorization</h1>
                <p className="text-sm text-muted-foreground">
                  Enter the code displayed on your device to authorize access
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <InputOTP
                  maxLength={8}
                  value={userCode}
                  onChange={(value) => {
                    setUserCode(value);
                    setError("");
                  }}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                    <InputOTPSlot index={6} />
                    <InputOTPSlot index={7} />
                  </InputOTPGroup>
                </InputOTP>

                {error && (
                  <p className="text-sm text-destructive font-medium">
                    {error}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || userCode.length !== 8}
                className="w-full"
              >
                {isLoading ? <Spinner /> : "Authorize Device"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevicePage;
