
import { toast as sonnerToast } from "sonner";
import * as React from "react";

const TOAST_LIMIT = 1;
export type ToasterToast = ReturnType<typeof useToast>["toast"];

type ToastActionElement = React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;

type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
};

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const useToast = () => {
  const toast = ({ title, description, action, variant }: ToastProps) => {
    sonnerToast(title as string, {
      description,
      action,
      className: variant === "destructive" ? "destructive" : undefined,
    });
  };

  return {
    toast,
  };
};

export { useToast, sonnerToast as toast };
