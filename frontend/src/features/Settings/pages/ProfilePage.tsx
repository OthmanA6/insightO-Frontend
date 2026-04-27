import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { User, Mail, Briefcase, Camera } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 animate-in fade-in zoom-in-95 duration-200 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h2>
        <p className="text-muted-foreground mt-1">Manage your personal information and profile settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Quick Info */}
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="relative group cursor-pointer mb-4">
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Profile picture" />
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary">JD</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground">John Doe</h3>
              <p className="text-sm text-muted-foreground mb-4">Senior HR Analyst</p>
              <div className="w-full flex justify-center gap-2">
                <Button variant="outline" size="sm" className="w-full">Change Picture</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Edit Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="John" startIcon={<User className="h-4 w-4" />} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Doe" startIcon={<User className="h-4 w-4" />} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="john.doe@insighto.ai" startIcon={<Mail className="h-4 w-4" />} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input id="jobTitle" defaultValue="Senior HR Analyst" startIcon={<Briefcase className="h-4 w-4" />} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t border-border bg-muted/20 mt-4 pt-4 pb-4 px-6 rounded-b-xl">
              <Button variant="ghost">Cancel</Button>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
