
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
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Please enter your password." }),
  // Honeypot field for bot protection
  website: z.string().max(0, { message: "Bot detected." }).optional(),
});

const twoFactorSchema = z.object({
    code: z.string().length(6, { message: "Code must be 6 digits." }),
});

const resetPasswordSchema = z.object({
    resetEmail: z.string().email({ message: "Please enter a valid email." })
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
  
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
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
    // Honeypot check
    if (values.website) {
        console.error("Honeypot field filled, likely a bot.");
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
      } else {
         await logLoginHistory(userCredential.user.uid);
         toast({
            title: "Login Successful",
            description: "You have successfully logged in. Redirecting to dashboard...",
         });
      }

    } catch (error) {
       console.error("Error signing in:", error);
       let description = "Invalid email or password.";
       if (error instanceof FirebaseError) {
         if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = "The email or password you entered is incorrect.";
         }
       }
       toast({ variant: "destructive", title: "Login Error", description });
    }
  }
  
  async function onTwoFactorSubmit(values: z.infer<typeof twoFactorSchema>) {
    if (!tempUser) return;
    
    // Placeholder for real 2FA validation
    if (values.code === '123456') {
        await logLoginHistory(tempUser.uid);
        toast({
            title: "Login Successful",
            description: "You have successfully logged in. Redirecting to dashboard...",
        });
        setLoginStep('credentials');
    } else {
        twoFactorForm.setError("code", { message: "Invalid verification code." });
    }
  }


  const handleGoogleSignIn = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      await createUserDocument(userCredential);
      await logLoginHistory(userCredential.user.uid);
      toast({
        title: "Login Successful",
        description: "You have successfully logged in with Google.",
      });
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Error",
        description: "There was a problem signing in with Google. Please try again.",
      });
    }
  };

  const handlePasswordReset = async (values: z.infer<typeof resetPasswordSchema>) => {
    try {
        await sendPasswordResetEmail(auth, values.resetEmail);
        toast({
            title: "Email Sent",
            description: "A password reset link has been sent to your email. Please also check your spam folder."
        })
        return true; 
    } catch (error) {
         console.error("Password Reset Error:", error);
         toast({
            variant: "destructive",
            title: "Error",
            description: "An error occurred while sending the reset email. Make sure you entered the correct email."
        })
        return false;
    }
  }


  if (loading || user) {
     return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 left-4">
        <Button variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center space-y-4">
          <Link href="/" className="flex justify-center">
            <VerdantVaultLogo className="h-12 w-12" />
          </Link>
          <CardTitle className="text-2xl font-headline">
            {loginStep === 'credentials' ? 'Login to Trusva' : 'Two-Factor Authentication'}
          </CardTitle>
          <CardDescription>
            {loginStep === 'credentials' 
              ? 'Enter your credentials to access your dashboard.'
              : 'Enter the 6-digit code from your authenticator app.'}
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
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="m@example.com" {...field}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <div className="flex items-center">
                            <FormLabel>Password</FormLabel>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="link" type="button" className="ml-auto p-0 h-auto text-sm underline">Forgot your password?</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <Form {...resetForm}>
                                    <form onSubmit={resetForm.handleSubmit(handlePasswordReset)}>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Reset Password</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Enter your account's email address and we will send you a link to reset your password.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="py-4">
                                        <FormField
                                            control={resetForm.control}
                                            name="resetEmail"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="m@example.com" {...field}/>
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                            />
                                    </div>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                                    <AlertDialogAction type="submit" disabled={resetForm.formState.isSubmitting}>
                                        {resetForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Send
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                    </form>
                                    </Form>
                                </AlertDialogContent>
                            </AlertDialog>

                        </div>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                      control={loginForm.control}
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
                    <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                    {loginForm.formState.isSubmitting ? "Logging in..." : "Login"}
                    </Button>
                </form>
                </Form>
                <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loginForm.formState.isSubmitting}>
                <Chrome className="mr-2 h-4 w-4" />
                Login with Google
                </Button>
                <div className="mt-4 text-center text-sm">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="underline">
                    Sign up
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
                            <FormLabel>Verification Code</FormLabel>
                            <FormControl>
                                <div className="relative">
                                <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input dir="ltr" placeholder="123456" {...field} className="tracking-[0.5em] text-center" maxLength={6}/>
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={twoFactorForm.formState.isSubmitting}>
                      {twoFactorForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify & Login
                    </Button>
                     <Button variant="link" onClick={() => setLoginStep('credentials')}>Back</Button>
                </form>
             </Form>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
