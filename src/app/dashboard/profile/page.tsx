
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
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: "نام باید حداقل ۲ حرف داشته باشد." }),
  lastName: z.string().min(2, { message: "نام خانوادگی باید حداقل ۲ حرف داشته باشد." }),
  email: z.string().email().describe("ایمیل شما قابل تغییر نیست."),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: "رمز عبور فعلی را وارد کنید." }),
  newPassword: z.string().min(6, { message: "رمز عبور جدید باید حداقل ۶ کاراکتر باشد." }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "رمزهای عبور جدید یکسان نیستند.",
  path: ["confirmPassword"],
});

const loginHistory = [
    { device: "دسکتاپ - ویندوز", ip: "192.168.1.10", date: "۱۴۰۳/۰۴/۱۰ - ۱۸:۳۰" },
    { device: "موبایل - آیفون", ip: "185.45.21.112", date: "۱۴۰۳/۰۴/۰۹ - ۱۲:۱۵" },
    { device: "تبلت - آیپد", ip: "192.168.1.10", date: "۱۴۰۳/۰۴/۰۸ - ۰۹:۰۰" },
];


export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [is2faEnabled, setIs2faEnabled] = useState(false);
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
    if (user) {
        setIsLoading(true);
        profileForm.setValue("email", user.email || "");

        const userRef = doc(db, "users", user.uid);
        getDoc(userRef).then(userSnap => {
            if (userSnap.exists()) {
                const userData = userSnap.data();
                profileForm.reset({
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: user.email || "",
                });
                setIs2faEnabled(userData.is2faEnabled || false);
            }
        }).finally(() => setIsLoading(false));
    }
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

  function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
     // TODO: Implement password change logic with Firebase Auth
     toast({
      title: "عملیات موفق",
      description: "قابلیت تغییر رمز عبور بزودی اضافه خواهد شد.",
    });
    passwordForm.reset();
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
                تاریخچه ورودهای اخیر به حساب شما (قابلیت نمایشی)
            </CardDescription>
          </CardFooter>
           <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>دستگاه</TableHead>
                        <TableHead>آدرس IP</TableHead>
                        <TableHead>تاریخ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loginHistory.map((login, index) => (
                        <TableRow key={index}>
                            <TableCell>{login.device}</TableCell>
                            <TableCell className="font-mono text-left" dir="ltr">{login.ip}</TableCell>
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

    