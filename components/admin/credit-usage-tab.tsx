"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { subscriptionsApi, ProfileCreditHistoryResponse } from "@/lib/api/subscriptions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Coins, Zap, Briefcase, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CreditUsageTabProps {
  profileId: string;
  profileType: 'seeker' | 'provider';
}

export function CreditUsageTab({ profileId, profileType }: CreditUsageTabProps) {
  const [data, setData] = useState<ProfileCreditHistoryResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCreditHistory() {
      try {
        const response = await subscriptionsApi.getProfileCreditHistory(profileId);
        if (response.success) {
          setData(response.data);
        } else {
          toast({ variant: "destructive", description: "Failed to load credit history" });
        }
      } catch (error) {
        toast({ variant: "destructive", description: "Error loading credit history" });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCreditHistory();
  }, [profileId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground animate-pulse">
        Loading credit and usage history...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No credit data available.
      </div>
    );
  }

  const { subscription, usageStats, transactions } = data;
  const credits = subscription?.credits || { planCredits: 0, extraCredits: 0, usedCredits: 0 };
  const plan = subscription?.planId;

  const renderTransactionBadge = (type: string) => {
    switch (type) {
      case 'credit': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Credit</Badge>;
      case 'debit': return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">Debit</Badge>;
      case 'addon': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Add-on</Badge>;
      case 'refund': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Refund</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plan Credits</CardTitle>
            <Coins className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{credits.planCredits}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Current Plan: <span className="font-semibold text-foreground">{plan?.name || "Free"}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top-up Credits</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{credits.extraCredits}</div>
            <p className="text-xs text-muted-foreground mt-1">Purchased out-of-plan</p>
          </CardContent>
        </Card>

        {profileType === 'seeker' ? (
          <>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Resumes Built</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{usageStats?.resumeBuildsUsed || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Lifetime usage</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Interviews Complete</CardTitle>
                <Briefcase className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{usageStats?.interviewsCompleted || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Lifetime usage</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Interviews Created</CardTitle>
                <Briefcase className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{usageStats?.totalInterviewsCreated || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Lifetime usage</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Candidates Interviewed</CardTitle>
                <Briefcase className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{usageStats?.totalCandidatesInterviewed || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Lifetime usage</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions && transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <TableRow key={tx._id} className="hover:bg-muted/30">
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(tx.createdAt), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>{renderTransactionBadge(tx.transactionType)}</TableCell>
                      <TableCell className="font-medium text-xs uppercase tracking-wider">{tx.actionType.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={tx.transactionType === 'debit' ? 'text-rose-500' : 'text-emerald-500'}>
                          {tx.transactionType === 'debit' ? '-' : '+'}{tx.creditsAmount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{tx.balanceAfter}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={tx.description}>
                        {tx.description}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No transaction history found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
