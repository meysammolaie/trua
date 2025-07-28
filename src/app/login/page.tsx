
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, signInWithPopup, UserCredential, sendPasswordResetEmail, User } from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
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
import { useEffect, useState, useMemo } from "react";
import { Loader2, Chrome, ShieldCheck } from "lucide-react";
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
} from "@/components/ui/alert-dialog"

const loginSchema = z.object({
  email: z.string().email({ message: "لطفاً یک ایمیل معتبر وارد کنید." }),
  password: z.string().min(1, { message: "لطفاً رمز عبور خود را وارد کنید." }),
  captcha: z.string().min(1, { message: "لطفاً به سوال امنیتی پاسخ دهید." }),
});

const twoFactorSchema = z.object({
    code: z.string().length(6, { message: "کد باید ۶ رقم باشد." }),
});

const resetPasswordSchema = z.object({
    resetEmail: z.string().email({ message: "لطفاً یک ایمیل معتبر وارد کنید." })
});

const logLoginHistory = async (userId: string) => {
  try {
      await addDoc(collection(db, "login_history"), {
          userId,
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent,
      });
  } catch (error) {
      console.error("Error logging login history:", error);
  }
};


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  
  const [loginStep, setLoginStep] = useState<'credentials' | '2fa'>('credentials');
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [is2faRequired, setIs2faRequired] = useState(false);

  // Captcha state
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);

  useEffect(() => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
  }, []);
  
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", captcha: "" },
  });

  const twoFactorForm = useForm<z.infer<typeof twoFactorSchema>>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: "" },
  });
  
  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { resetEmail: "" },
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

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    if (parseInt(values.captcha, 10) !== num1 + num2) {
      loginForm.setError("captcha", { message: "پاسخ سوال امنیتی اشتباه است." });
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const is2faEnabled = userDocSnap.exists() && userDocSnap.data().is2faEnabled;

      if (is2faEnabled) {
          setIs2faRequired(true);
          setTempUser(userCredential.user);
          setLoginStep('2fa');
          // Don't log history or redirect yet
      } else {
         await logLoginHistory(userCredential.user.uid);
         toast({
            title: "ورود موفق",
            description: "شما با موفقیت وارد شدید. در حال انتقال به داشبورد...",
         });
         // The useEffect hook will handle redirection
      }

    } catch (error) {
       console.error("Error signing in:", error);
       let description = "ایمیل یا رمز عبور نامعتبر است.";
       if (error instanceof FirebaseError) {
         if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = "ایمیل یا رمز عبور وارد شده صحیح نمی‌باشد.";
         }
       }
       toast({ variant: "destructive", title: "خطا در ورود", description });
    }
  }
  
  async function onTwoFactorSubmit(values: z.infer<typeof twoFactorSchema>) {
    if (!tempUser) return;
    
    // Placeholder for real 2FA validation
    if (values.code === '123456') {
        await logLoginHistory(tempUser.uid);
        toast({
            title: "ورود موفق",
            description: "شما با موفقیت وارد شدید. در حال انتقال به داشبورد...",
        });
        // Now set the user in the auth context to trigger redirect
        // This is handled by the onAuthStateChanged listener, so we just need to complete the flow.
        setLoginStep('credentials'); // Reset for next time
    } else {
        twoFactorForm.setError("code", { message: "کد تایید نامعتبر است." });
    }
  }


  const handleGoogleSignIn = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      await createUserDocument(userCredential);
      await logLoginHistory(userCredential.user.uid);
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

  const handlePasswordReset = async (values: z.infer<typeof resetPasswordSchema>) => {
    try {
        await sendPasswordResetEmail(auth, values.resetEmail);
        toast({
            title: "ایمیل ارسال شد",
            description: "یک ایمیل حاوی لینک بازنشانی رمز عبور برای شما ارسال شد. لطفاً پوشه اسپم را نیز بررسی کنید."
        })
        return true; // Indicate success to close dialog
    } catch (error) {
         console.error("Password Reset Error:", error);
         toast({
            variant: "destructive",
            title: "خطا",
            description: "خطایی در ارسال ایمیل بازنشانی رخ داد. مطمئن شوید ایمیل را درست وارد کرده‌اید."
        })
        return false;
    }
  }


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
            {loginStep === 'credentials' ? 'ورود به Trusva' : 'تایید دو مرحله‌ای'}
          </CardTitle>
          <CardDescription>
            {loginStep === 'credentials' 
              ? 'برای دسترسی به داشبورد خود، اطلاعات خود را وارد کنید.'
              : 'کد ۶ رقمی از اپلیکیشن احراز هویت خود را وارد کنید.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loginStep === 'credentials' ? (
            <div className="grid gap-4">
                <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="grid gap-4">
                    <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem className="text-right">
                        <FormLabel>ایمیل</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="m@example.com" dir="ltr" {...field}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem className="text-right">
                        <div className="flex items-center">
                            <FormLabel>رمز عبور</FormLabel>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="link" type="button" className="mr-auto p-0 h-auto text-sm underline">رمز عبور خود را فراموش کرده‌اید؟</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <Form {...resetForm}>
                                    <form onSubmit={resetForm.handleSubmit(handlePasswordReset)}>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>بازیابی رمز عبور</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        ایمیل حساب کاربری خود را وارد کنید تا لینک بازیابی برای شما ارسال شود.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="py-4">
                                        <FormField
                                            control={resetForm.control}
                                            name="resetEmail"
                                            render={({ field }) => (
                                                <FormItem className="text-right">
                                                <FormLabel>ایمیل</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="m@example.com" dir="ltr" {...field}/>
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                            />
                                    </div>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel type="button">انصراف</AlertDialogCancel>
                                    <AlertDialogAction type="submit" disabled={resetForm.formState.isSubmitting}>
                                        {resetForm.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                        ارسال
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                    </form>
                                    </Form>
                                </AlertDialogContent>
                            </AlertDialog>

                        </div>
                        <FormControl>
                            <Input type="password" dir="ltr" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="captcha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>سوال امنیتی: {num1} + {num2} = ؟</FormLabel>
                          <FormControl>
                            <Input type="number" dir="ltr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                    {loginForm.formState.isSubmitting ? "در حال ورود..." : "ورود"}
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
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loginForm.formState.isSubmitting}>
                <Chrome className="ml-2 h-4 w-4" />
                ورود با گوگل
                </Button>
                <div className="mt-4 text-center text-sm">
                    حساب کاربری ندارید؟{" "}
                    <Link href="/signup" className="underline">
                    ثبت نام کنید
                    </Link>
                </div>
            </div>
          ) : (
             <Form {...twoFactorForm}>
                <form onSubmit={twoFactorForm.handleSubmit(onTwoFactorSubmit)} className="grid gap-4">
                     <FormField
                        control={twoFactorForm.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>کد تایید</FormLabel>
                            <FormControl>
                                <div className="relative">
                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input dir="ltr" placeholder="123456" {...field} className="tracking-[0.5em] text-center" maxLength={6}/>
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={twoFactorForm.formState.isSubmitting}>
                      {twoFactorForm.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      تایید و ورود
                    </Button>
                     <Button variant="link" onClick={() => setLoginStep('credentials')}>بازگشت</Button>
                </form>
             </Form>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
