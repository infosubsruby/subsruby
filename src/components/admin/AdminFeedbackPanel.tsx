import { useState } from "react";
import { useFeedback, FeedbackWithUser } from "@/hooks/useFeedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  AlertCircle, 
  Star, 
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Reply
} from "lucide-react";
import { cn } from "@/lib/utils";

type SortField = "created_at" | "type" | "status";
type SortOrder = "asc" | "desc";

const typeIcons = {
  bug: Bug,
  suggestion: Lightbulb,
  report: AlertCircle,
  general: MessageSquare,
};

const typeColors = {
  bug: "bg-red-500/20 text-red-400",
  suggestion: "bg-yellow-500/20 text-yellow-400",
  report: "bg-orange-500/20 text-orange-400",
  general: "bg-blue-500/20 text-blue-400",
};

const statusColors = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/20 text-warning",
  resolved: "bg-success/20 text-success",
  closed: "bg-secondary text-secondary-foreground",
};

export const AdminFeedbackPanel = () => {
  const { feedbacks, isLoading, updateFeedbackResponse } = useFeedback();
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithUser | null>(null);
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState<string>("pending");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedFeedbacks = [...feedbacks].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === "created_at") {
      comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortField === "type") {
      comparison = a.type.localeCompare(b.type);
    } else if (sortField === "status") {
      comparison = a.status.localeCompare(b.status);
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleRespond = async () => {
    if (!selectedFeedback || !response.trim()) return;

    setIsSubmitting(true);
    await updateFeedbackResponse(
      selectedFeedback.id,
      response,
      newStatus as FeedbackWithUser["status"]
    );
    setIsSubmitting(false);
    setSelectedFeedback(null);
    setResponse("");
  };

  const openResponseDialog = (feedback: FeedbackWithUser) => {
    setSelectedFeedback(feedback);
    setResponse(feedback.admin_response || "");
    setNewStatus(feedback.status);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading feedbacks...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Sorting Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort("created_at")}
          className={cn(sortField === "created_at" && "border-primary")}
        >
          Date
          {sortField === "created_at" && (
            sortOrder === "desc" ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort("type")}
          className={cn(sortField === "type" && "border-primary")}
        >
          Type
          {sortField === "type" && (
            sortOrder === "desc" ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort("status")}
          className={cn(sortField === "status" && "border-primary")}
        >
          Status
          {sortField === "status" && (
            sortOrder === "desc" ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />
          )}
        </Button>
      </div>

      {/* Feedbacks Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFeedbacks.map((feedback) => {
              const TypeIcon = typeIcons[feedback.type];
              return (
                <TableRow key={feedback.id} className="border-border">
                  <TableCell className="font-medium">
                    {feedback.user_name || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={typeColors[feedback.type]}>
                      <TypeIcon className="w-3 h-3 mr-1" />
                      {feedback.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {feedback.subject}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[feedback.status]}>
                      {feedback.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {feedback.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span>{feedback.rating}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(feedback.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openResponseDialog(feedback)}
                    >
                      <Reply className="w-4 h-4 mr-1" />
                      Respond
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {feedbacks.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No feedbacks yet
          </div>
        )}
      </div>

      {/* Response Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>Respond to Feedback</DialogTitle>
            <DialogDescription>
              From: {selectedFeedback?.user_name} • {selectedFeedback?.type}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Original message */}
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="font-medium text-sm mb-1">{selectedFeedback?.subject}</p>
              <p className="text-sm text-muted-foreground">{selectedFeedback?.message}</p>
            </div>

            {/* Response */}
            <Textarea
              placeholder="Write your response..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="min-h-[120px]"
            />

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Status:</span>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRespond}
              disabled={isSubmitting || !response.trim()}
              className="ruby-gradient"
            >
              {isSubmitting ? "Sending..." : "Send Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
