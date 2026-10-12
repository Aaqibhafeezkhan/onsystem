'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface PlanSummaryCardProps {
  planName?: string;
  plan?: string;
  monthlyPrice?: string | number;
  price?: string | number;
  renewalDate?: string;
  nextRenewalDate?: string;
  status?: string;
  buttonText?: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  onManageSubscription?: () => void;
  action?: string | ((formData: FormData) => void | Promise<void>);
  className?: string;
}

export function PlanSummaryCard({
  planName,
  plan,
  monthlyPrice,
  price,
  renewalDate,
  nextRenewalDate,
  status = "Active",
  buttonText = "Manage subscription",
  buttonVariant = "default",
  onManageSubscription,
  action,
  className,
}: PlanSummaryCardProps) {
  const displayPlanName = planName ?? plan ?? "Pro";
  const displayPrice =
    typeof monthlyPrice === "number"
      ? `$${monthlyPrice}/month`
      : typeof price === "number"
      ? `$${price}/month`
      : monthlyPrice ?? price ?? "$20 / month";
  const displayRenewalDate = renewalDate ?? nextRenewalDate ?? "May 1, 2025";
  const displayStatus = status ?? "Active";

  const manageButton = (
    <Button
      type={action ? "submit" : "button"}
      variant={buttonVariant}
      onClick={onManageSubscription}
    >
      {buttonText}
    </Button>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl font-bold">{displayPlanName}</CardTitle>
        <CardDescription>Current Plan</CardDescription>
        <CardAction>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-chart-2/15 px-2.5 py-0.5 text-xs font-medium text-chart-2">
            <span className="size-1.5 rounded-full bg-chart-2" />
            {displayStatus}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Monthly price</p>
          <p className="text-2xl font-semibold text-foreground">{displayPrice}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Next renewal date</p>
          <p className="text-base font-medium text-foreground">{displayRenewalDate}</p>
        </div>
      </CardContent>
      <CardFooter>
        {action ? <form action={action}>{manageButton}</form> : manageButton}
      </CardFooter>
    </Card>
  );
}

export default PlanSummaryCard;
