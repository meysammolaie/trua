
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
  title: z.string().min(5, "Title must be at least 5 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
  target: z.enum(["all", "specific"], {
    required_error: "You must select a target type.",
  }),
  userId: z.string().optional(),
}).refine((data) => {
    if (data.target === "specific") {
        return !!data.userId && data.userId.trim().length > 0;
    }
    return true;
}, {
    message: "User ID is required for specific notifications.",
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
        toast({ title: "Notification Sent", description: result.message });
        form.reset();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Sending Notification",
        description: error instanceof Error ? error.message : "An error occurred.",
      });
    }
  };
  
  const targetValue = form.watch("target");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Notification to Users</CardTitle>
        <CardDescription>
          Send important messages, updates, or special offers to your users.
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
                  <FormLabel>Notification Recipient</FormLabel>
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
                        <FormLabel className="font-normal">Send to all users</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="specific" />
                        </FormControl>
                        <FormLabel className="font-normal">Send to a specific user</FormLabel>
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
                    <FormLabel>User ID</FormLabel>
                    <FormControl>
                      <Input dir="ltr" placeholder="Enter User ID here" {...field} />
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
                  <FormLabel>Notification Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Important Platform Update" {...field} />
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
                  <FormLabel>Full Message Body</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Write your message here..." className="min-h-[120px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Notification
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
