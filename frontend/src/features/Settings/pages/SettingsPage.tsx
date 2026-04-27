import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Bell, Lock, Shield, Eye, Globe, Smartphone } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 animate-in fade-in zoom-in-95 duration-200 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar for Settings */}
        <div className="md:col-span-1 space-y-1">
          <Button variant="secondary" className="w-full justify-start font-medium text-foreground bg-muted/50">
            <Bell className="mr-2 h-4 w-4" /> Notifications
          </Button>
          <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground">
            <Lock className="mr-2 h-4 w-4" /> Security
          </Button>
          <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground">
            <Shield className="mr-2 h-4 w-4" /> Privacy
          </Button>
          <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground">
            <Globe className="mr-2 h-4 w-4" /> Language & Region
          </Button>
          <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground">
            <Smartphone className="mr-2 h-4 w-4" /> Connected Devices
          </Button>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3 space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what updates you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground uppercase tracking-wider">Email Notifications</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">Receive a weekly summary of your department's performance.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">New Evaluations</Label>
                    <p className="text-sm text-muted-foreground">Get notified when a new evaluation is assigned to you.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">System Updates</Label>
                    <p className="text-sm text-muted-foreground">Important notifications about the insightO platform.</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="h-px bg-border w-full"></div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground uppercase tracking-wider">In-App Notifications</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Direct Mentions</Label>
                    <p className="text-sm text-muted-foreground">Notify me when someone mentions me in a comment.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-border bg-muted/20 mt-4 pt-4 pb-4 px-6 rounded-b-xl">
              <Button>Save Preferences</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
