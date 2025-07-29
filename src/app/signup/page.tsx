
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
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character." }),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
  // Honeypot field for bot protection
  website: z.string().max(0, { message: "Bot detected." }).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
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
            toast({ title: "Referrer Confirmed", description: `You have been referred by ${referrerDoc.data().firstName}.`});
        } else {
            toast({ variant: 'destructive', title: "Invalid Referral Code", description: "The entered referral code is not valid."});
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
        title: "Signup Successful",
        description: "Your account has been created. Redirecting to dashboard...",
      });
    } catch (error) {
      console.error("Error signing up:", error);
      let description = "An error occurred during signup. Please try again.";
      if (error instanceof FirebaseError) {
        if (error.code === "auth/email-already-in-use") {
          description = "This email is already in use. Please log in instead.";
        }
      }
      toast({
        variant: "destructive",
        title: "Signup Error",
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
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>
            Enter your information to start investing.
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
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
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
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="m@example.com"
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
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="referralCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referral Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter referral code" {...field} disabled={!!searchParams.get('ref')}/>
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
                  {form.formState.isSubmitting ? "Creating Account..." : "Create Account"}
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
             <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={form.formState.isSubmitting}>
               <Chrome className="mr-2 h-4 w-4" />
              Sign up with Google
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Log in
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
