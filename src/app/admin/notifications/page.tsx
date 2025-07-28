
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { createNotificationAction } from "@/app/actions/notifications";
import { Loader2, Send } from "lucide-react";

const notificationSchema = z.object({
  title: z.string().min(5, "عنوان باید حداقل ۵ حرف داشته باشد."),
  message: z.string().min(10, "پیام باید حداقل ۱۰ حرف داشته باشد."),
  target: z.enum(["all", "specific"], {
    required_error: "باید نوع هدف را انتخاب کنید.",
  }),
  userId: z.string().optional(),
}).refine((data) => {
    if (data.target === "specific") {
        return !!data.userId && data.userId.trim().length > 0;
    }
    return true;
}, {
    message: "شناسه کاربر برای ارسال اعلان خصوصی الزامی است.",
    path: ["userId"],
});

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: "",
      message: "",
      target: "all",
      userId: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof notificationSchema>) => {
    try {
      const result = await createNotificationAction(values);
      if (result.success) {
        toast({ title: "اعلان ارسال شد", description: result.message });
        form.reset();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطا در ارسال اعلان",
        description: error instanceof Error ? error.message : "مشکلی پیش آمد.",
      });
    }
  };
  
  const targetValue = form.watch("target");

  return (
    <Card>
      <CardHeader>
        <CardTitle>ارسال اعلان به کاربران</CardTitle>
        <CardDescription>
          برای کاربران خود پیام‌های مهم، بروزرسانی‌ها یا پیشنهادات ویژه ارسال کنید.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>گیرنده اعلان</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="all" />
                        </FormControl>
                        <FormLabel className="font-normal">ارسال به همه کاربران</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="specific" />
                        </FormControl>
                        <FormLabel className="font-normal">ارسال به یک کاربر خاص</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {targetValue === "specific" && (
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شناسه کاربر (User ID)</FormLabel>
                    <FormControl>
                      <Input dir="ltr" placeholder="شناسه کاربری را اینجا وارد کنید" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان اعلان</FormLabel>
                  <FormControl>
                    <Input placeholder="مثلا: بروزرسانی مهم پلتفرم" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>متن کامل پیام</FormLabel>
                  <FormControl>
                    <Textarea placeholder="پیام خود را اینجا بنویسید..." className="min-h-[120px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="ml-2 h-4 w-4" />
              )}
              ارسال اعلان
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
