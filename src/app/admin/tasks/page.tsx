
"use client";

import { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createTaskAction, getTasksAction, deleteTaskAction, Task } from "@/app/actions/tasks";
import { Badge } from "@/components/ui/badge";

const taskSchema = z.object({
  title: z.string().min(5, "عنوان باید حداقل ۵ حرف داشته باشد."),
  description: z.string().min(10, "توضیحات باید حداقل ۱۰ حرف داشته باشد."),
  rewardAmount: z.coerce.number().positive("مقدار پاداش باید مثبت باشد."),
  rewardType: z.enum(["usd", "gold"]),
});

export default function AdminTasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      rewardAmount: 10,
      rewardType: "usd",
    },
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const existingTasks = await getTasksAction();
      setTasks(existingTasks);
    } catch (error) {
      toast({ variant: "destructive", title: "خطا", description: "مشکلی در دریافت لیست وظایف رخ داد." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const onSubmit = async (values: z.infer<typeof taskSchema>) => {
    try {
      const result = await createTaskAction(values);
      if (result.success) {
        toast({ title: "موفق", description: "وظیفه جدید با موفقیت ایجاد شد." });
        form.reset();
        await fetchTasks();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطا در ایجاد وظیفه",
        description: error instanceof Error ? error.message : "مشکلی پیش آمد.",
      });
    }
  };

   const handleDelete = async (taskId: string) => {
    try {
        const result = await deleteTaskAction({ taskId });
        if(result.success) {
            toast({ title: "موفق", description: "وظیفه با موفقیت حذف شد." });
            await fetchTasks();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
         toast({
            variant: "destructive",
            title: "خطا در حذف وظیفه",
            description: error instanceof Error ? error.message : "مشکلی پیش آمد.",
        });
    }
  }


  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>ایجاد وظیفه جدید</CardTitle>
          <CardDescription>
            برای کاربران وظایف جدید تعریف کنید تا با انجام آن‌ها پاداش دریافت کنند.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان وظیفه</FormLabel>
                    <FormControl>
                      <Input placeholder="مثلا: معرفی ۵ دوست به پلتفرم" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات کامل وظیفه</FormLabel>
                    <FormControl>
                      <Textarea placeholder="شرایط و نحوه انجام وظیفه را به طور کامل شرح دهید." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="rewardAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مقدار پاداش (دلار)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="ml-2 h-4 w-4" />
                )}
                ایجاد وظیفه
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>لیست وظایف فعال</CardTitle>
          <CardDescription>وظایف تعریف‌شده در سیستم را مدیریت کنید.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>عنوان</TableHead>
                <TableHead>پاداش</TableHead>
                <TableHead>تاریخ ایجاد</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    هیچ وظیفه‌ای تعریف نشده است.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">${task.rewardAmount.toLocaleString()}</Badge>
                    </TableCell>
                    <TableCell>{task.createdAt}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(task.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
