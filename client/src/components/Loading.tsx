import React from "react";
import { Spinner } from "./ui/spinner";

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Spinner className="size-8" />
    </div>
  );
};

export default Loading;
