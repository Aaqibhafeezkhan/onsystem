"use client";

import { Button, Input, useCopyToClipboard } from "@dub/ui";
import { Copy, Tick } from "@dub/ui/icons";
import { cn, linkConstructor } from "@dub/utils";
import { forwardRef, HTMLProps } from "react";
import { toast } from "sonner";

export type CopyShortLinkProps = {
  url?: string;
  value?: string;
  link?: string;
  domain?: string;
  key?: string;
  className?: string;
  inputClassName?: string;
  copyButtonClassName?: string;
} & Omit<HTMLProps<HTMLDivElement>, "value" | "url">;

export const CopyShortLink = forwardRef<HTMLDivElement, CopyShortLinkProps>(
  (
    {
      url,
      value,
      link,
      domain,
      key,
      className,
      inputClassName,
      copyButtonClassName,
      ...props
    },
    ref,
  ) => {
    const shortUrl =
      url ||
      value ||
      link ||
      (domain && key
        ? linkConstructor({ domain, key, clean: true })
        : domain
          ? `https://${domain}`
          : "");

    const [copied, copyToClipboard] = useCopyToClipboard(2000);

    const handleCopy = () => {
      copyToClipboard(shortUrl, {
        onSuccess: () => {
          toast.success("Copied to clipboard!");
        },
      });
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <Input
          type="text"
          readOnly
          value={shortUrl}
          className={cn("font-mono text-sm", inputClassName)}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={handleCopy}
          className={cn("h-9 w-9 shrink-0 p-0", copyButtonClassName)}
          icon={
            copied ? (
              <Tick className="size-4" />
            ) : (
              <Copy className="size-4" />
            )
          }
          aria-label={copied ? "Copied" : "Copy"}
        />
      </div>
    );
  },
);

CopyShortLink.displayName = "CopyShortLink";
