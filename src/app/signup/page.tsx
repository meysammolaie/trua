
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { VerdantVaultLogo } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Loader2, Chrome } from "lucide-react";

const formSchema = z.object({
  firstName: z.string().min(2, { message: "نام باید حداقل ۲ حرف داشته باشد." }),
  lastName: z.string().min(2, { message: "نام خانوادگی باید حداقل ۲ حرف داشته باشد." }),
  email: z.string().email({ message: "لطفاً یک ایمیل معتبر وارد کنید." }),
  password: z.string().min(6, { message: "رمز عبور باید حداقل ۶ کاراکتر داشته باشد." }),
});

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      password: "password123",
    },
  });

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
     // Temporarily bypass Firebase for development
     toast({
        title: "ثبت نام موفق",
        description: "حساب کاربری شما با موفقیت ایجاد شد. در حال انتقال به داشبورد...",
      });
      router.push("/dashboard");

    // try {
    //   await createUserWithEmailAndPassword(auth, values.email, values.password);
    //   toast({
    //     title: "ثبت نام موفق",
    //     description: "حساب کاربری شما با موفقیت ایجاد شد. در حال انتقال به داشبورد...",
    //   });
    //   // router.push("/dashboard"); // This will be handled by useEffect
    // } catch (error) {
    //   console.error("Error signing up:", error);
    //   let description = "خطایی در هنگام ثبت‌نام رخ داد. لطفاً دوباره تلاش کنید.";
    //   if (error instanceof FirebaseError) {
    //     if (error.code === "auth/email-already-in-use") {
    //       description = "این ایمیل قبلاً استفاده شده است. لطفاً از صفحه ورود، وارد شوید.";
    //     }
    //   }
    //   toast({
    //     variant: "destructive",
    //     title: "خطا در ثبت نام",
    //     description,
    //   });
    // }
  }
  
  const handleGoogleSignIn = async () => {
    // try {
    //   await signInWithPopup(auth, googleProvider);
    //   toast({
    //     title: "ورود موفق",
    //     description: "شما با موفقیت از طریق گوگل وارد شدید.",
    //   });
    //   // router.push("/dashboard"); // This will be handled by useEffect
    // } catch (error) {
    //   console.error("Google Sign-In Error:", error);
    //   toast({
    //     variant: "destructive",
    //     title: "خطا در ورود با گوگل",
    //     description: "مشکلی در هنگام ورود با گوگل پیش آمد. لطفاً دوباره تلاش کنید.",
    //   });
    // }
  };

  if (loading || user) {
     return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">در حال انتقال به داشبورد...</p>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 left-4">
        <Button variant="outline" asChild>
          <Link href="/">بازگشت به خانه</Link>
        </Button>
      </div>
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center space-y-4">
          <Link href="/" className="flex justify-center">
            <VerdantVaultLogo className="h-12 w-12" />
          </Link>
          <CardTitle className="text-2xl font-headline">ایجاد حساب کاربری</CardTitle>
          <CardDescription>
            برای شروع سرمایه‌گذاری، اطلاعات خود را وارد کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="text-right">
                        <FormLabel>نام</FormLabel>
                        <FormControl>
                          <Input placeholder="علی" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="text-right">
                        <FormLabel>نام خانوادگی</FormLabel>
                        <FormControl>
                          <Input placeholder="رضایی" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel>ایمیل</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="m@example.com"
                          dir="ltr"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel>رمز عبور</FormLabel>
                      <FormControl>
                        <Input type="password" dir="ltr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "در حال ایجاد حساب..." : "ایجاد حساب"}
                </Button>
              </form>
            </Form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  یا ادامه با
                </span>
              </div>
            </div>
             <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
               <Chrome className="ml-2 h-4 w-4" />
              ثبت‌نام با گوگل
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            <Link href="/login" className="underline">
              وارد شوید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
