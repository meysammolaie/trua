
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, signInWithPopup, UserCredential, updateProfile } from "firebase/auth";
import { auth, db, googleProvider } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp, query, where, getDocs, collection } from "firebase/firestore";
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
import { useEffect, Suspense } from "react";
import { Loader2, Chrome } from "lucide-react";

const formSchema = z.object({
  firstName: z.string().min(2, { message: "نام باید حداقل ۲ حرف داشته باشد." }),
  lastName: z.string().min(2, { message: "نام خانوادگی باید حداقل ۲ حرف داشته باشد." }),
  email: z.string().email({ message: "لطفاً یک ایمیل معتبر وارد کنید." }),
  password: z.string().min(6, { message: "رمز عبور باید حداقل ۶ کاراکتر داشته باشد." }),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
  // Honeypot field for bot protection
  website: z.string().max(0, { message: "ربات شناسایی شد." }).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "رمزهای عبور یکسان نیستند.",
  path: ["confirmPassword"],
});


function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      referralCode: "",
    },
  });

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      form.setValue('referralCode', refCode);
    }
  }, [searchParams, form]);


  useEffect(() => {
    if (user) {
      if (user.email === 'admin@example.com') {
         router.push("/admin");
      } else {
         router.push("/dashboard");
      }
    }
  }, [user, router]);
  
  const createUserDocument = async (userCred: UserCredential, values: Partial<z.infer<typeof formSchema>>) => {
    const userRef = doc(db, "users", userCred.user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const { email, uid } = userCred.user;
      
      let referredBy = null;
      if (values.referralCode) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("referralCode", "==", values.referralCode));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const referrerDoc = querySnapshot.docs[0];
            referredBy = referrerDoc.id; // Store referrer's UID
            toast({ title: "معرف شما تایید شد", description: `شما توسط ${referrerDoc.data().firstName} معرفی شده‌اید.`});
        } else {
            toast({ variant: 'destructive', title: "کد معرف نامعتبر", description: "کد معرف وارد شده صحیح نمی‌باشد."});
        }
      }

      await setDoc(userRef, {
        uid,
        email,
        firstName: values.firstName,
        lastName: values.lastName,
        createdAt: serverTimestamp(),
        status: "active",
        is2faEnabled: false,
        referralCode: uid.substring(0, 8), // Generate a unique referral code
        referredBy: referredBy, // Can be null
      });

      await updateProfile(userCred.user, {
        displayName: `${values.firstName} ${values.lastName}`
      });
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Honeypot check
    if (values.website) {
        console.error("Honeypot field filled, likely a bot.");
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await createUserDocument(userCredential, values);
      toast({
        title: "ثبت نام موفق",
        description: "حساب کاربری شما با موفقیت ایجاد شد. در حال انتقال به داشبورد...",
      });
    } catch (error) {
      console.error("Error signing up:", error);
      let description = "خطایی در هنگام ثبت‌نام رخ داد. لطفاً دوباره تلاش کنید.";
      if (error instanceof FirebaseError) {
        if (error.code === "auth/email-already-in-use") {
          description = "این ایمیل قبلاً استفاده شده است. لطفاً از صفحه ورود، وارد شوید.";
        }
      }
      toast({
        variant: "destructive",
        title: "خطا در ثبت نام",
        description,
      });
    }
  }
  
  const handleGoogleSignIn = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const { displayName } = userCredential.user;
      const nameParts = displayName?.split(" ") || ["", ""];
      
      const referralCodeFromUrl = searchParams.get('ref') || '';

      await createUserDocument(userCredential, {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" "),
        referralCode: referralCodeFromUrl,
      });

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
                 <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel>تکرار رمز عبور</FormLabel>
                      <FormControl>
                        <Input type="password" dir="ltr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="referralCode"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel>کد معرف (اختیاری)</FormLabel>
                      <FormControl>
                        <Input placeholder="کد معرف خود را وارد کنید" dir="ltr" {...field} disabled={!!searchParams.get('ref')}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem className="absolute left-[-5000px]">
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="Your website" {...field} tabIndex={-1} autoComplete="off"/>
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
             <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={form.formState.isSubmitting}>
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


export default function SignupPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignupForm />
        </Suspense>
    )
}
