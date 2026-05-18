import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Star } from "lucide-react"
import { format } from "date-fns"
import { FeedbackItem } from "@/lib/api/feedback"
import { SentimentBadge } from "./sentiment-badge"

interface RawDataTableProps {
  list: FeedbackItem[];
  loading: boolean;
  filters: { featureKey?: string; sentiment?: string; profileType?: string };
  pagination: { page: number; limit: number; totalCount: number; totalPages: number };
  onFilterChange: (key: string, value: string) => void;
  onPageChange: (newPage: number) => void;
  onRowClick: (item: FeedbackItem) => void;
}

export function RawDataTable({ 
  list, 
  loading, 
  filters, 
  pagination, 
  onFilterChange, 
  onPageChange, 
  onRowClick 
}: RawDataTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Raw Feedback Data</CardTitle>
            <CardDescription>Detailed logs of user submissions</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filters.featureKey || "all"} onValueChange={(val) => onFilterChange("featureKey", val)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Features" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Features</SelectItem>
                <SelectItem value="resumeBuilder">Resume Builder</SelectItem>
                <SelectItem value="jdGenerator">JD Generator</SelectItem>
                <SelectItem value="quickOptimize">Quick Optimize</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.sentiment || "all"} onValueChange={(val) => onFilterChange("sentiment", val)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="Positive">Positive</SelectItem>
                <SelectItem value="Neutral">Neutral</SelectItem>
                <SelectItem value="Negative">Negative</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Sentiment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ) : list.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No feedback found for the selected filters.</TableCell></TableRow>
              ) : (
                list.map((item) => (
                  <TableRow key={item._id} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(item)}>
                    <TableCell className="whitespace-nowrap">{format(new Date(item.createdAt), 'MMM dd, HH:mm')}</TableCell>
                    <TableCell><Badge variant="outline">{item.profileType}</Badge></TableCell>
                    <TableCell className="font-medium">{item.featureKey}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < item.rating ? 'fill-primary text-primary' : 'text-muted'}`} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">{item.comment || <span className="text-muted-foreground italic">No comment</span>}</TableCell>
                    <TableCell><SentimentBadge sentiment={item.sentiment} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination controls */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">Showing page {pagination.page} of {pagination.totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
