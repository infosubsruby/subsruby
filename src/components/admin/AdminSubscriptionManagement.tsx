import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Loader2, 
  Search, 
  ExternalLink,
  Save,
  X,
  DollarSign,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { currencies } from "@/data/subscriptionPresets";

interface SubscriptionData {
  id: number;
  name: string;
  slug: string;
  price: number;
  currency: string | null;
  website_url: string | null;
  user_id: string;
  user_name?: string;
}

interface GroupedSubscription {
  name: string;
  slug: string;
  subscriptions: SubscriptionData[];
  prices: {
    USD: number[];
    EUR: number[];
    GBP: number[];
    TRY: number[];
    MXN: number[];
    CAD: number[];
    AUD: number[];
    JPY: number[];
    INR: number[];
    BRL: number[];
  };
  website_url: string | null;
}

export const AdminSubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [groupedSubscriptions, setGroupedSubscriptions] = useState<GroupedSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingService, setEditingService] = useState<GroupedSubscription | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editable fields
  const [editPrices, setEditPrices] = useState({
    USD: "",
    EUR: "",
    GBP: "",
    TRY: "",
    MXN: "",
    CAD: "",
    AUD: "",
    JPY: "",
    INR: "",
    BRL: ""
  });
  const [editUrl, setEditUrl] = useState("");

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    
    // Fetch all subscriptions with user info
    const { data: subs, error } = await supabase
      .from("subscriptions")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to fetch subscriptions");
      console.error(error);
      setIsLoading(false);
      return;
    }

    // Get user names for each subscription
    const subsWithUserNames: SubscriptionData[] = await Promise.all(
      (subs || []).map(async (sub) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", sub.user_id)
          .maybeSingle();

        return {
          ...sub,
          user_name: profile 
            ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown"
            : "Unknown"
        };
      })
    );

    setSubscriptions(subsWithUserNames);
    
    // Group subscriptions by service name/slug
    const grouped = groupSubscriptionsByService(subsWithUserNames);
    setGroupedSubscriptions(grouped);
    
    setIsLoading(false);
  };

  const groupSubscriptionsByService = (subs: SubscriptionData[]): GroupedSubscription[] => {
    const groups: Record<string, GroupedSubscription> = {};

    subs.forEach((sub) => {
      const key = sub.slug.toLowerCase();
      
      if (!groups[key]) {
        groups[key] = {
          name: sub.name,
          slug: sub.slug,
          subscriptions: [],
          prices: { USD: [], EUR: [], GBP: [], TRY: [], MXN: [], CAD: [], AUD: [], JPY: [], INR: [], BRL: [] },
          website_url: sub.website_url
        };
      }
      
      groups[key].subscriptions.push(sub);
      
      // Collect prices by currency
      const currency = (sub.currency || "USD") as keyof typeof groups[typeof key]["prices"];
      if (groups[key].prices[currency]) {
        groups[key].prices[currency].push(sub.price);
      }
      
      // Update website_url if current one is null
      if (!groups[key].website_url && sub.website_url) {
        groups[key].website_url = sub.website_url;
      }
    });

    return Object.values(groups).sort((a, b) => 
      b.subscriptions.length - a.subscriptions.length
    );
  };

  const getMostCommonPrice = (prices: number[]): number | null => {
    if (prices.length === 0) return null;
    
    const frequency: Record<number, number> = {};
    prices.forEach((price) => {
      frequency[price] = (frequency[price] || 0) + 1;
    });
    
    let maxCount = 0;
    let mostCommon = prices[0];
    
    Object.entries(frequency).forEach(([price, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = parseFloat(price);
      }
    });
    
    return mostCommon;
  };

  const handleEditService = (service: GroupedSubscription) => {
    setEditingService(service);
    setEditPrices({
      USD: getMostCommonPrice(service.prices.USD)?.toString() || "",
      EUR: getMostCommonPrice(service.prices.EUR)?.toString() || "",
      GBP: getMostCommonPrice(service.prices.GBP)?.toString() || "",
      TRY: getMostCommonPrice(service.prices.TRY)?.toString() || "",
      MXN: getMostCommonPrice(service.prices.MXN)?.toString() || "",
      CAD: getMostCommonPrice(service.prices.CAD)?.toString() || "",
      AUD: getMostCommonPrice(service.prices.AUD)?.toString() || "",
      JPY: getMostCommonPrice(service.prices.JPY)?.toString() || "",
      INR: getMostCommonPrice(service.prices.INR)?.toString() || "",
      BRL: getMostCommonPrice(service.prices.BRL)?.toString() || ""
    });
    setEditUrl(service.website_url || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!editingService) return;
    
    setIsSaving(true);
    
    try {
      // Update all subscriptions for this service
      const updates = editingService.subscriptions.map(async (sub) => {
        const currency = (sub.currency || "USD") as keyof typeof editPrices;
        const newPrice = editPrices[currency];
        
        const updateData: Record<string, unknown> = {};
        
        // Update price if a new one was entered for this currency
        if (newPrice && !isNaN(parseFloat(newPrice))) {
          updateData.price = parseFloat(newPrice);
        }
        
        // Update URL for all
        if (editUrl) {
          updateData.website_url = editUrl;
        }
        
        if (Object.keys(updateData).length > 0) {
          return supabase
            .from("subscriptions")
            .update(updateData)
            .eq("id", sub.id);
        }
        return null;
      });

      await Promise.all(updates.filter(Boolean));
      
      toast.success(`Updated ${editingService.name} for all users`);
      setIsEditDialogOpen(false);
      fetchSubscriptions();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update subscriptions");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredServices = groupedSubscriptions.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-sm">
          {groupedSubscriptions.length} services • {subscriptions.length} total subscriptions
        </Badge>
      </div>

      {/* Services Table */}
      <div className="glass-card rounded-xl overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Service</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>USD</TableHead>
              <TableHead>EUR</TableHead>
              <TableHead>GBP</TableHead>
              <TableHead>TRY</TableHead>
              <TableHead>MXN</TableHead>
              <TableHead>More</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.map((service) => {
              const otherCurrencies = [
                { code: "CAD", price: getMostCommonPrice(service.prices.CAD), symbol: "C$" },
                { code: "AUD", price: getMostCommonPrice(service.prices.AUD), symbol: "A$" },
                { code: "JPY", price: getMostCommonPrice(service.prices.JPY), symbol: "¥" },
                { code: "INR", price: getMostCommonPrice(service.prices.INR), symbol: "₹" },
                { code: "BRL", price: getMostCommonPrice(service.prices.BRL), symbol: "R$" },
              ].filter(c => c.price !== null);
              
              return (
                <TableRow key={service.slug} className="border-border">
                  <TableCell className="font-medium">
                    {service.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {service.subscriptions.length}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {getMostCommonPrice(service.prices.USD) 
                      ? `$${getMostCommonPrice(service.prices.USD)?.toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {getMostCommonPrice(service.prices.EUR)
                      ? `€${getMostCommonPrice(service.prices.EUR)?.toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {getMostCommonPrice(service.prices.GBP)
                      ? `£${getMostCommonPrice(service.prices.GBP)?.toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {getMostCommonPrice(service.prices.TRY)
                      ? `₺${getMostCommonPrice(service.prices.TRY)?.toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {getMostCommonPrice(service.prices.MXN)
                      ? `$${getMostCommonPrice(service.prices.MXN)?.toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {otherCurrencies.length > 0 ? (
                      <span title={otherCurrencies.map(c => `${c.code}: ${c.symbol}${c.price?.toFixed(2)}`).join(", ")}>
                        +{otherCurrencies.length}
                      </span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {service.website_url ? (
                      <a 
                        href={service.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Link
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditService(service)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredServices.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            {searchTerm ? "No services found matching your search" : "No subscriptions found"}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit {editingService?.name}
            </DialogTitle>
            <DialogDescription>
              Update prices and URL for all {editingService?.subscriptions.length} users subscribed to this service.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Prices */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Prices by Currency
              </label>
              <div className="grid grid-cols-2 gap-3">
                {currencies.map((curr) => (
                  <div key={curr.value} className="space-y-1">
                    <label className="text-xs text-muted-foreground">{curr.label}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {curr.symbol}
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={
                          getMostCommonPrice(editingService?.prices[curr.value as keyof typeof editPrices] || [])?.toString() || "0.00"
                        }
                        value={editPrices[curr.value as keyof typeof editPrices]}
                        onChange={(e) => setEditPrices(prev => ({
                          ...prev,
                          [curr.value]: e.target.value
                        }))}
                        className="pl-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Management URL
              </label>
              <Input
                placeholder="https://..."
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This URL will be used for the "Manage" button on subscription cards
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="ruby-gradient border-0"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
