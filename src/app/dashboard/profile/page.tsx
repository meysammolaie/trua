
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Loader2, Copy } from "lucide-react";
import { LoginHistoryRecord } from "@/ai/flows/get-login-history-flow";
import { getLoginHistoryAction } from "@/app/actions/security";

const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email().describe("Your email cannot be changed."),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Please enter your current password." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"],
});


export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [loginHistory, setLoginHistory] = useState<LoginHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  useEffect(() => {
    async function loadInitialData() {
        if (user) {
            setIsLoading(true);
            profileForm.setValue("email", user.email || "");

            const userRef = doc(db, "users", user.uid);
            const userSnapPromise = getDoc(userRef);
            const historyPromise = getLoginHistoryAction({ userId: user.uid });

            const [userSnap, historyResponse] = await Promise.all([userSnapPromise, historyPromise]);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                profileForm.reset({
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: user.email || "",
                });
                setIs2faEnabled(userData.is2faEnabled || false);
                setReferralCode(userData.referralCode || "");
            }

            if (historyResponse) {
                setLoginHistory(historyResponse.history);
            }
            
            setIsLoading(false);
        }
    }
    loadInitialData();
  }, [user, profileForm]);


  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    try {
        await updateDoc(userRef, {
            firstName: values.firstName,
            lastName: values.lastName,
        });
        toast({
          title: "Success",
          description: "Your profile information has been updated.",
        });
    } catch (error) {
         toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while updating your profile.",
        });
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    if (!user || !user.email) {
        toast({ variant: "destructive", title: "Error", description: "Invalid user." });
        return;
    }

    const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
    
    try {
        await reauthenticateWithCredential(user, credential);
        // User re-authenticated. Now, change the password.
        await updatePassword(user, values.newPassword);
        
        toast({
            title: "Success",
            description: "Your password has been changed successfully.",
        });
        passwordForm.reset();

    } catch (error) {
        let description = "An error occurred while changing your password.";
        if (error instanceof FirebaseError) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                description = "Your current password is incorrect.";
            }
        }
        toast({
            variant: "destructive",
            title: "Error",
            description: description,
        });
    }
  }

  const handle2faToggle = async (enabled: boolean) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    try {
        await updateDoc(userRef, { is2faEnabled: enabled });
        setIs2faEnabled(enabled);
        toast({
            title: "Success",
            description: `Two-factor authentication has been ${enabled ? 'enabled' : 'disabled'}.`
        });
    } catch (error) {
         toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while changing the 2FA status.",
        });
    }
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
        title: "Copied!",
        description: "Your referral code has been copied to the clipboard."
    })
  }
  
  if (isLoading) {
      return (
          <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin" />
          </div>
      )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Profile & Settings</h1>
      </div>
      <div className="grid gap-6">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Manage your personal information here.
            </CardDescription>
          </CardHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={profileForm.control}
                    name="firstName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Your first name" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={profileForm.control}
                    name="lastName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Your last name" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input readOnly disabled {...field} />
                      </FormControl>
                       <FormDescription>
                          Your account email cannot be changed.
                       </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {referralCode && (
                    <FormItem>
                        <FormLabel>Your Referral Code</FormLabel>
                        <div className="flex items-center gap-2">
                             <Input readOnly value={referralCode} dir="ltr" />
                             <Button type="button" variant="outline" size="icon" onClick={copyReferralCode}>
                               <Copy className="h-4 w-4" />
                             </Button>
                        </div>
                        <FormDescription>
                           Share this code with your friends to earn referral bonuses.
                        </FormDescription>
                    </FormItem>
                 )}
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                    {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {profileForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        {/* Password Management Card */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Change your password regularly for better security.
            </CardDescription>
          </CardHeader>
           <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                <CardContent className="space-y-4">
                    <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                        {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {passwordForm.formState.isSubmitting ? "Changing..." : "Change Password"}
                    </Button>
                </CardFooter>
            </form>
           </Form>
        </Card>
        
        {/* Security Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <h3 className="font-medium">Two-Factor Authentication (2FA)</h3>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account. (Test code: 123456)</p>
                </div>
                <Switch 
                    checked={is2faEnabled}
                    onCheckedChange={handle2faToggle}
                    aria-label="Toggle 2FA" 
                />
             </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
             <CardDescription>
                Recent login history for your account
            </CardDescription>
          </CardFooter>
           <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Device</TableHead>
                        <TableHead>Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loginHistory.map((login) => (
                        <TableRow key={login.id}>
                            <TableCell>{login.device}</TableCell>
                            <TableCell>{login.date}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
