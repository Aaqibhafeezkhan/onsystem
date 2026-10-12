"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

type PlanSummaryCardProps = {
  planName: string;
  /** Monthly price in US dollars. */
  monthlyPrice: number;
  nextRenewalDate: Date;
  onManage?: () => void;
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric"
});

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  nextRenewalDate,
  onManage
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Current plan</CardDescription>
        <CardTitle className="text-lg">{planName}</CardTitle>
        <CardAction>
          <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium text-green-500">
            <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
            Active
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-2xl font-semibold">
          {priceFormatter.format(monthlyPrice)}
          <span className="text-muted-foreground text-sm font-normal"> / month</span>
        </p>
        <p className="text-muted-foreground text-sm">
          Next renewal: {dateFormatter.format(nextRenewalDate)}
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={onManage}>
          Manage subscription
        </Button>
      </CardFooter>
    </Card>
  );
}
