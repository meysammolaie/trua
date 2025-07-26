"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, signInWithPopup, UserCredential } from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
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
  email: z.string().email({ message: "لطفاً یک ایمیل معتبر وارد کنید." }),
  password: z.string().min(1, { message: "لطفاً رمز عبور خود را وارد کنید." }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      if (user.email === 'admin@example.com') {
         router.push("/admin");
      } else {
         router.push("/dashboard");
      }
    }
  }, [user, router]);
  
  const createUserDocument = async (userCred: UserCredential) => {
    const userRef = doc(db, "users", userCred.user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        const { email, uid, displayName } = userCred.user;
        const nameParts = displayName?.split(" ") || [];
        await setDoc(userRef, {
            uid,
            email,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            createdAt: new Date(),
        });
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "ورود موفق",
        description: "شما با موفقیت وارد شدید. در حال انتقال به داشبورد...",
      });
    } catch (error) {
       console.error("Error signing in:", error);
      let description = "ایمیل یا رمز عبور نامعتبر است.";
       if (error instanceof FirebaseError) {
         if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = "ایمیل یا رمز عبور وارد شده صحیح نمی‌باشد.";
         }
       }
      toast({
        variant: "destructive",
        title: "خطا در ورود",
        description,
      });
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      await createUserDocument(userCredential);
      toast({
        title: "ورود موفق",
        description: "شما با موفقیت از طریق گوگل وارد شدید.",
      });
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      toast({
        variant: "destructive",
        title: "خطا در ورود با گوگل",
        description: "مشکلی در هنگام ورود با گوگل پیش آمد. لطفاً دوباره تلاش کنید.",
      });
    }
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
          <CardTitle className="text-2xl font-headline">
            ورود به Trusva
          </CardTitle>
          <CardDescription>
            برای دسترسی به داشبورد خود، ایمیل و رمز عبور خود را وارد کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
                      <div className="flex items-center">
                        <FormLabel>رمز عبور</FormLabel>
                        <Link
                          href="#"
                          className="mr-auto inline-block text-sm underline"
                        >
                          رمز عبور خود را فراموش کرده‌اید؟
                        </Link>
                      </div>
                      <FormControl>
                        <Input type="password" dir="ltr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "در حال ورود..." : "ورود"}
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
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={form.formState.isSubmitting}>
              <Chrome className="ml-2 h-4 w-4" />
              ورود با گوگل
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            حساب کاربری ندارید؟{" "}
            <Link href="/signup" className="underline">
              ثبت نام کنید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
