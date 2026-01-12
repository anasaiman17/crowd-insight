import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Settings, AlertTriangle, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAlerts, Alert, AlertThreshold } from '@/hooks/useAlerts';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const AlertsPanel: React.FC = () => {
  const { alerts, thresholds, unreadCount, markAsRead, markAllAsRead, updateThreshold, addThreshold } = useAlerts();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newThreshold, setNewThreshold] = useState<{ threshold_count: number; density_trigger: 'low' | 'medium' | 'high' }>({ threshold_count: 30, density_trigger: 'high' });
  const { toast } = useToast();

  const handleAddThreshold = async () => {
    const { error } = await addThreshold({
      ...newThreshold,
      camera_id: null,
      is_enabled: true,
      notify_email: false,
      notify_in_app: true,
    });
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to add threshold', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Alert threshold added' });
      setNewThreshold({ threshold_count: 30, density_trigger: 'high' });
    }
  };

  const getAlertColor = (density: 'low' | 'medium' | 'high') => {
    switch (density) {
      case 'high': return 'text-destructive bg-destructive/10 border-destructive/30';
      case 'medium': return 'text-warning bg-warning/10 border-warning/30';
      default: return 'text-success bg-success/10 border-success/30';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Alert Settings */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Alert Thresholds</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Existing Thresholds */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Current Thresholds</h4>
              {thresholds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No thresholds configured</p>
              ) : (
                thresholds.map((threshold) => (
                  <div key={threshold.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`h-5 w-5 ${
                        threshold.density_trigger === 'high' ? 'text-destructive' :
                        threshold.density_trigger === 'medium' ? 'text-warning' : 'text-success'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">
                          {threshold.threshold_count} people / {threshold.density_trigger} density
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {threshold.camera_id ? 'Specific camera' : 'All cameras'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={threshold.is_enabled}
                      onCheckedChange={(checked) => updateThreshold(threshold.id, { is_enabled: checked })}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Add New Threshold */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h4 className="text-sm font-medium">Add New Threshold</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">People Count</label>
                  <Input
                    type="number"
                    min={1}
                    value={newThreshold.threshold_count}
                    onChange={(e) => setNewThreshold(prev => ({ ...prev, threshold_count: parseInt(e.target.value) || 30 }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Density Trigger</label>
                  <select
                    className="w-full h-10 px-3 rounded-md bg-background border border-input text-sm"
                    value={newThreshold.density_trigger}
                    onChange={(e) => setNewThreshold(prev => ({ ...prev, density_trigger: e.target.value as 'low' | 'medium' | 'high' }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleAddThreshold} className="w-full">
                Add Threshold
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alerts Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>Alerts</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-100px)] mt-4">
            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No alerts yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${getAlertColor(alert.density_level)} ${
                      !alert.is_read ? 'ring-2 ring-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(alert.created_at), 'MMM d, HH:mm')}
                          </p>
                        </div>
                      </div>
                      {!alert.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => markAsRead(alert.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AlertsPanel;
