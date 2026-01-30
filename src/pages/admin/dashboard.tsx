import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAllSeries, useDeleteSeries } from "@/hooks/useSeries";
import { formatViewCount } from "@/hooks/useViews";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  LogOut,
  BookPlus,
  Home,
  Tag,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const AdminDashboard = () => {
  const { user, loading: authLoading, signOut, isAuthenticated, isAdmin } = useAuth();
  const { data: series, isLoading: seriesLoading } = useAllSeries();
  const deleteSeries = useDeleteSeries();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate("/admin/login");
      } else if (!isAdmin) {
        navigate("/admin/login");
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/admin/login");
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteSeries.mutateAsync(id);
      toast.success(`"${title}" deleted successfully`);
    } catch (error) {
      toast.error("Failed to delete series");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <span className="font-display text-lg font-bold text-foreground">
                  BnToon Admin
                </span>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-1" />
                  View Site
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl shadow-card p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Series</p>
            <p className="text-3xl font-display font-bold text-foreground">
              {series?.length || 0}
            </p>
          </div>
          <div className="bg-card rounded-xl shadow-card p-6">
            <p className="text-sm text-muted-foreground mb-1">Ongoing</p>
            <p className="text-3xl font-display font-bold text-foreground">
              {series?.filter((s) => s.status === "ongoing").length || 0}
            </p>
          </div>
          <div className="bg-card rounded-xl shadow-card p-6">
            <p className="text-sm text-muted-foreground mb-1">Completed</p>
            <p className="text-3xl font-display font-bold text-foreground">
              {series?.filter((s) => s.status === "completed").length || 0}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/admin/genres">
            <Button variant="outline" className="gap-2">
              <Tag className="h-4 w-4" />
              Manage Genres
            </Button>
          </Link>
        </div>

        {/* Series Management */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-foreground">
            Manage Series
          </h2>
          <Link to="/admin/series/new">
            <Button className="btn-accent">
              <Plus className="h-4 w-4 mr-1" />
              New Series
            </Button>
          </Link>
        </div>

        {seriesLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : series && series.length > 0 ? (
          <div className="space-y-3">
            {series.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 p-4 bg-card rounded-lg shadow-card"
              >
                {/* Cover Thumbnail */}
                <div className="h-16 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  {s.cover_url ? (
                    <img
                      src={s.cover_url}
                      alt={s.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-secondary">
                      <span className="font-bold text-muted-foreground/50">
                        {s.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {s.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className="capitalize text-xs"
                    >
                      {s.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Updated {format(new Date(s.updated_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>

                {/* Views */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">
                    {formatViewCount(s.total_views || 0)}
                  </span>
                  <span className="text-xs text-muted-foreground">views</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link to={`/admin/series/${s.id}/chapters`}>
                    <Button variant="outline" size="sm">
                      <BookPlus className="h-4 w-4 mr-1" />
                      Chapters
                    </Button>
                  </Link>
                  <Link to={`/admin/series/${s.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Series</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{s.title}"? This will also delete all chapters and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(s.id, s.title)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl shadow-card">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">No series yet</p>
            <Link to="/admin/series/new">
              <Button className="btn-accent">
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Series
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
