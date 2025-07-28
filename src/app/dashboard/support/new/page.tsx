
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
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createTicketAction } from "@/app/actions/support";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

const ticketSchema = z.object({
  subject: z.string().min(5, "موضوع باید حداقل ۵ حرف داشته باشد."),
  department: z.enum(['technical', 'financial', 'general'], {
    required_error: "انتخاب دپارتمان الزامی است.",
  }),
  priority: z.enum(['low', 'medium', 'high'], {
    required_error: "انتخاب اولویت الزامی است.",
  }),
  message: z.string().min(10, "متن پیام باید حداقل ۱۰ حرف داشته باشد."),
});

export default function NewTicketPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    
    const form = useForm<z.infer<typeof ticketSchema>>({
        resolver: zodResolver(ticketSchema),
        defaultValues: {
            subject: "",
            department: "general",
            priority: "medium",
            message: "",
        },
    });
    
    const { isSubmitting } = form.formState;

    async function onSubmit(values: z.infer<typeof ticketSchema>) {
        if (!user) {
            toast({ variant: "destructive", title: "خطا", description: "برای ایجاد تیکت باید وارد شوید." });
            return;
        }

        try {
            const result = await createTicketAction({ userId: user.uid, ...values });
            if (result.success && result.ticketId) {
                toast({ title: "موفق", description: "تیکت شما با موفقیت ثبت شد." });
                router.push(`/dashboard/support/${result.ticketId}`);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "خطا در ایجاد تیکت",
                description: error instanceof Error ? error.message : "مشکلی پیش آمد.",
            });
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>ایجاد تیکت جدید</CardTitle>
                        <CardDescription>مشکل یا سوال خود را با تیم پشتیبانی در میان بگذارید.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowRight className="ml-2 h-4 w-4" />
                        بازگشت
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>موضوع</FormLabel>
                                <FormControl>
                                    <Input placeholder="مثلا: مشکل در برداشت وجه" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>دپارتمان</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="انتخاب دپارتمان" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="general">عمومی</SelectItem>
                                        <SelectItem value="financial">مالی</SelectItem>
                                        <SelectItem value="technical">فنی</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                             <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>اولویت</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="انتخاب اولویت" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="low">پایین</SelectItem>
                                        <SelectItem value="medium">متوسط</SelectItem>
                                        <SelectItem value="high">بالا</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                        <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>پیام شما</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="مشکل خود را به طور کامل شرح دهید..." className="min-h-[150px]" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                         <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            ارسال تیکت
                        </Button>
                    </form>
                 </Form>
            </CardContent>
        </Card>
    )
}
