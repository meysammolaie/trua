
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
  firstName: z.string().min(2, { message: "نام باید حداقل ۲ حرف داشته باشد." }),
  lastName: z.string().min(2, { message: "نام خانوادگی باید حداقل ۲ حرف داشته باشد." }),
  email: z.string().email().describe("ایمیل شما قابل تغییر نیست."),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "رمز عبور فعلی را وارد کنید." }),
  newPassword: z.string().min(6, { message: "رمز عبور جدید باید حداقل ۶ کاراکتر باشد." }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "رمزهای عبور جدید یکسان نیستند.",
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
          title: "موفقیت‌آمیز",
          description: "اطلاعات پروفایل شما با موفقیت به‌روزرسانی شد.",
        });
    } catch (error) {
         toast({
          variant: "destructive",
          title: "خطا",
          description: "خطایی در به‌روزرسانی پروفایل رخ داد.",
        });
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    if (!user || !user.email) {
        toast({ variant: "destructive", title: "خطا", description: "کاربر معتبر نیست." });
        return;
    }

    const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
    
    try {
        await reauthenticateWithCredential(user, credential);
        // User re-authenticated. Now, change the password.
        await updatePassword(user, values.newPassword);
        
        toast({
            title: "موفقیت‌آمیز",
            description: "رمز عبور شما با موفقیت تغییر کرد.",
        });
        passwordForm.reset();

    } catch (error) {
        let description = "خطایی در تغییر رمز عبور رخ داد.";
        if (error instanceof FirebaseError) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                description = "رمز عبور فعلی شما اشتباه است.";
            }
        }
        toast({
            variant: "destructive",
            title: "خطا",
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
            title: "موفقیت‌آمیز",
            description: `احراز هویت دو مرحله‌ای ${enabled ? 'فعال' : 'غیرفعال'} شد.`
        });
    } catch (error) {
         toast({
          variant: "destructive",
          title: "خطا",
          description: "خطایی در تغییر وضعیت احراز هویت دو مرحله‌ای رخ داد.",
        });
    }
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
        title: "کپی شد!",
        description: "کد معرف شما در کلیپ‌بورد کپی شد."
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
        <h1 className="text-lg font-semibold md:text-2xl">پروفایل و تنظیمات</h1>
      </div>
      <div className="grid gap-6">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات پروفایل</CardTitle>
            <CardDescription>
              اطلاعات شخصی خود را اینجا مدیریت کنید.
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
                        <FormLabel>نام</FormLabel>
                        <FormControl>
                            <Input placeholder="نام شما" {...field} />
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
                        <FormLabel>نام خانوادگی</FormLabel>
                        <FormControl>
                            <Input placeholder="نام خانوادگی شما" {...field} />
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
                      <FormLabel>ایمیل</FormLabel>
                      <FormControl>
                        <Input readOnly disabled {...field} />
                      </FormControl>
                       <FormDescription>
                          ایمیل حساب کاربری شما قابل تغییر نیست.
                       </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {referralCode && (
                    <FormItem>
                        <FormLabel>کد معرف شما</FormLabel>
                        <div className="flex items-center gap-2">
                             <Input readOnly value={referralCode} dir="ltr" />
                             <Button type="button" variant="outline" size="icon" onClick={copyReferralCode}>
                               <Copy className="h-4 w-4" />
                             </Button>
                        </div>
                        <FormDescription>
                           این کد را با دوستان خود به اشتراک بگذارید تا از مزایای معرفی بهره‌مند شوید.
                        </FormDescription>
                    </FormItem>
                 )}
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                    {profileForm.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    {profileForm.formState.isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        {/* Password Management Card */}
        <Card>
          <CardHeader>
            <CardTitle>تغییر رمز عبور</CardTitle>
            <CardDescription>
              برای امنیت بیشتر، به طور منظم رمز عبور خود را تغییر دهید.
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
                        <FormLabel>رمز عبور فعلی</FormLabel>
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
                            <FormLabel>رمز عبور جدید</FormLabel>
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
                            <FormLabel>تکرار رمز عبور جدید</FormLabel>
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
                        {passwordForm.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        {passwordForm.formState.isSubmitting ? "در حال تغییر..." : "تغییر رمز عبور"}
                    </Button>
                </CardFooter>
            </form>
           </Form>
        </Card>
        
        {/* Security Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>تنظیمات امنیتی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <h3 className="font-medium">احراز هویت دو مرحله‌ای (2FA)</h3>
                    <p className="text-sm text-muted-foreground">یک لایه امنیتی بیشتر به حساب خود اضافه کنید.</p>
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
                تاریخچه ورودهای اخیر به حساب شما
            </CardDescription>
          </CardFooter>
           <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>دستگاه</TableHead>
                        <TableHead>تاریخ</TableHead>
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
