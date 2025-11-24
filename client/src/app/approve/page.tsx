"use client";
import Loading from "@/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/authClient";
import { CheckCircle2, Shield, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ApprovePage = () => {
  const { data, isPending } = authClient.useSession();
  const user = data?.user;
  const searchParams = useSearchParams();
  const userCode = searchParams.get("user_code");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !user) {
      // Redirect to login if not authenticated
      router.push(`/sign-in?redirect=/approve?user_code=${userCode}`);
    }
  }, [user, isPending, userCode, router]);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      if (!userCode) throw new Error("User code is missing");

      await authClient.device.approve({
        userCode: userCode,
      });
      toast.success("Device approved successfully!");
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      toast.error("Failed to approve device. Please try again.");
      console.error(error);
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    setIsProcessing(true);
    try {
      if (!userCode) throw new Error("User code is missing");

      await authClient.device.deny({
        userCode: userCode,
      });
      toast.info("Device authorization denied");
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      toast.error("Failed to deny device. Please try again.");
      console.error(error);
      setIsProcessing(false);
    }
  };

  if (isPending) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Shield className="size-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              Device Authorization Request
            </CardTitle>
            <CardDescription>
              A device is requesting access to your account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.image || ""} alt="avatar" />
                <AvatarFallback className="text-lg">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.name || "User"}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Authorization Code
              </p>
              <div className="flex items-center justify-center p-3 rounded-lg bg-muted">
                <code className="text-2xl font-mono font-bold tracking-wider">
                  {userCode}
                </code>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-4 border border-amber-200 dark:border-amber-900">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <strong>Important:</strong> Only approve if you initiated this
                request. This will grant the device full access to your account.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDeny}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <Spinner />
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Deny
                  </>
                )}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <Spinner />
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApprovePage;
